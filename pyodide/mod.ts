import {
    ErrorInFFIExecution,
    ListValue,
    NumberValue,
    PrimitiveValue,
    StringValue,
    BooleanValue,
    ValueType,
    ReferenceStore,
    type Extension,
    type ExtensionManifest,
    type FunctionInvokingParams,
} from '@dalbit-yaksok/core'
import { PARSING_RULES } from './parsing-rules.ts'

export class Pyodide implements Extension {
    public manifest: ExtensionManifest = {
        parsingRules: PARSING_RULES,
        ffiRunner: {
            runtimeName: 'Python',
        },
    }

    private pyodide: any | null = null
    private tempVarCounter: number = 0

    constructor(private packages: string[] = []) {}

    async init(): Promise<void> {
        // Deno/서버 환경: npm 패키지 사용
        if (typeof (globalThis as any).document === 'undefined') {
            const lib = 'pyodide-module'
            const mod: any = await import(lib)
            const loadPyodide = mod.loadPyodide || mod.default?.loadPyodide

            if (typeof loadPyodide !== 'function') {
                throw new Error(
                    'Cannot load Pyodide: loadPyodide is not available',
                )
            }

            this.pyodide = await loadPyodide()
        } else {
            // 브라우저 환경: CDN 사용
            const url =
                'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs'
            const { loadPyodide } = await import(url)
            this.pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            })
        }

        await this.pyodide.loadPackage(this.packages)
        console.debug(
            `[Pyodide.init] loaded package ${this.packages.join(', ')}`,
        )
    }

    async executeFFI(
        code: string,
        args: FunctionInvokingParams,
    ): Promise<ValueType> {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized')
        }

        try {
            console.debug('[Pyodide.executeFFI] start', {
                code,
                argsKeys: Object.keys(args),
            })

            if (code.startsWith('CALL ')) {
                const name = code.slice(5).trim()
                const ordered = Object.keys(args)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((k) => args[k])

                const argSnippets: string[] = []
                const tempVarNames: string[] = []
                for (let i = 0; i < ordered.length; i++) {
                    const a = ordered[i]
                    if (a instanceof ReferenceStore) {
                        const varName = `__yak_arg_${Date.now()}_${this
                            .tempVarCounter++}_${i}`
                        this.pyodide!.globals.set(varName, a.ref)
                        argSnippets.push(varName)
                        tempVarNames.push(varName)
                    } else {
                        argSnippets.push(convertYaksokToPythonLiteral(a))
                    }
                }

                const pyArgs = argSnippets.join(', ')
                const pyCode = `${name}(${pyArgs})`
                const runner =
                    this.pyodide.runPythonAsync || this.pyodide.runPython
                console.debug('[Pyodide.executeFFI] CALL pyCode', pyCode)
                let result
                try {
                    result = await runner.call(this.pyodide, pyCode)
                } finally {
                    if (tempVarNames.length) {
                        try {
                            const cleanup = tempVarNames
                                .map((n) => `del ${n}`)
                                .join('; ')
                            await runner.call(this.pyodide, cleanup)
                        } catch (_) {
                            // ignore cleanup errors
                        }
                    }
                }
                console.debug('[Pyodide.executeFFI] CALL result', {
                    type: typeof result,
                    ctor: (result as any)?.constructor?.name,
                })
                return convertPythonResultToYaksok(result)
            } else if (code === 'CALL_REF') {
                const orderedKeys = Object.keys(args).sort(
                    (a, b) => Number(a) - Number(b),
                )
                const targetArg = args['0']
                if (!targetArg) {
                    throw new Error('CALL_REF requires target in args[0]')
                }

                const runner =
                    this.pyodide.runPythonAsync || this.pyodide.runPython

                let targetVarName: string | null = null
                const tempVarNames: string[] = []
                try {
                    if (targetArg instanceof ReferenceStore) {
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        this.pyodide!.globals.set(targetVarName, targetArg.ref)
                        tempVarNames.push(targetVarName)
                    } else {
                        const literal = convertYaksokToPythonLiteral(targetArg)
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        await runner.call(
                            this.pyodide,
                            `${targetVarName} = ${literal}`,
                        )
                        tempVarNames.push(targetVarName)
                    }

                    const callArgs: string[] = []
                    for (const k of orderedKeys) {
                        const idx = Number(k)
                        if (idx === 0) continue
                        const v = args[k]
                        if (v instanceof ReferenceStore) {
                            const varName = `__yak_arg_${Date.now()}_${this
                                .tempVarCounter++}_${idx}`
                            this.pyodide!.globals.set(varName, v.ref)
                            callArgs.push(varName)
                            tempVarNames.push(varName)
                        } else {
                            callArgs.push(convertYaksokToPythonLiteral(v))
                        }
                    }

                    const pyArgs = callArgs.join(', ')
                    const pyCode = `${targetVarName}(${pyArgs})`
                    console.debug('[Pyodide.executeFFI] CALL_REF pyCode', pyCode)
                    const result = await runner.call(this.pyodide, pyCode)
                    return convertPythonResultToYaksok(result)
                } finally {
                    if (tempVarNames.length) {
                        try {
                            const cleanup = tempVarNames
                                .map((n) => `del ${n}`)
                                .join('; ')
                            await runner.call(this.pyodide, cleanup)
                        } catch (_) {
                            // ignore cleanup errors
                        }
                    }
                }
            } else if (code.startsWith('CALL_ATTR ')) {
                const attr = code.slice('CALL_ATTR '.length).trim()
                const targetArg = args['0']
                if (!targetArg) {
                    throw new Error('CALL_ATTR requires target in args[0]')
                }

                const runner =
                    this.pyodide.runPythonAsync || this.pyodide.runPython

                let targetVarName: string | null = null
                const tempVarNames: string[] = []
                try {
                    if (targetArg instanceof ReferenceStore) {
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        this.pyodide!.globals.set(targetVarName, targetArg.ref)
                        tempVarNames.push(targetVarName)
                    } else {
                        const literal = convertYaksokToPythonLiteral(targetArg)
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        await runner.call(
                            this.pyodide,
                            `${targetVarName} = ${literal}`,
                        )
                        tempVarNames.push(targetVarName)
                    }

                    const pyCode = `${targetVarName}.${attr}`
                    console.debug('[Pyodide.executeFFI] CALL_ATTR pyCode', pyCode)
                    const result = await runner.call(this.pyodide, pyCode)
                    return convertPythonResultToYaksok(result)
                } finally {
                    if (tempVarNames.length) {
                        try {
                            const cleanup = tempVarNames
                                .map((n) => `del ${n}`)
                                .join('; ')
                            await runner.call(this.pyodide, cleanup)
                        } catch (_) {
                            // ignore cleanup errors
                        }
                    }
                }
            } else if (code.startsWith('CALL_METHOD ')) {
                const method = code.slice('CALL_METHOD '.length).trim()
                const orderedKeys = Object.keys(args).sort(
                    (a, b) => Number(a) - Number(b),
                )
                const targetArg = args['0']
                if (!targetArg) {
                    throw new Error('CALL_METHOD requires target in args[0]')
                }

                const runner =
                    this.pyodide.runPythonAsync || this.pyodide.runPython

                // Prepare target
                let targetVarName: string | null = null
                const tempVarNames: string[] = []
                try {
                    if (targetArg instanceof ReferenceStore) {
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        this.pyodide!.globals.set(targetVarName, targetArg.ref)
                        tempVarNames.push(targetVarName)
                    } else {
                        // For primitive/list types, convert to Python literal
                        const literal = convertYaksokToPythonLiteral(targetArg)
                        targetVarName = `__yak_target_${Date.now()}_${this
                            .tempVarCounter++}`
                        await runner.call(
                            this.pyodide,
                            `${targetVarName} = ${literal}`,
                        )
                        tempVarNames.push(targetVarName)
                    }

                    // Prepare args (exclude index 0)
                    const callArgs: string[] = []
                    for (const k of orderedKeys) {
                        const idx = Number(k)
                        if (idx === 0) continue
                        const v = args[k]
                        if (v instanceof ReferenceStore) {
                            const varName = `__yak_arg_${Date.now()}_${this
                                .tempVarCounter++}_${idx}`
                            this.pyodide!.globals.set(varName, v.ref)
                            callArgs.push(varName)
                            tempVarNames.push(varName)
                        } else {
                            callArgs.push(convertYaksokToPythonLiteral(v))
                        }
                    }

                    const pyArgs = callArgs.join(', ')
                    const pyCode = `${targetVarName}.${method}(${pyArgs})`
                    console.debug(
                        '[Pyodide.executeFFI] CALL_METHOD pyCode',
                        pyCode,
                    )
                    const result = await runner.call(this.pyodide, pyCode)
                    return convertPythonResultToYaksok(result)
                } finally {
                    if (tempVarNames.length) {
                        try {
                            const cleanup = tempVarNames
                                .map((n) => `del ${n}`)
                                .join('; ')
                            await runner.call(this.pyodide, cleanup)
                        } catch (_) {
                            // ignore cleanup errors
                        }
                    }
                }
            } else {
                const runner =
                    this.pyodide.runPythonAsync || this.pyodide.runPython
                console.debug('[Pyodide.executeFFI] EVAL code', code.trim())
                await runner.call(this.pyodide, code)
                console.debug('[Pyodide.executeFFI] EVAL done')
                return new NumberValue(0)
            }
        } catch (e: any) {
            if (e instanceof ErrorInFFIExecution) throw e

            const message = e?.message ?? String(e)
            console.error('[Pyodide.executeFFI][error]', {
                message,
                stack: e?.stack,
            })
            throw new ErrorInFFIExecution({
                message: `Pyodide 실행 중 오류: ${message}`,
            })
        }
    }
}

function convertYaksokToPythonLiteral(v: ValueType): string {
    if (v instanceof StringValue) {
        return JSON.stringify(v.value)
    } else if (v instanceof NumberValue) {
        return String(v.value)
    } else if (v instanceof BooleanValue) {
        return v.value ? 'True' : 'False'
    } else if (v instanceof ListValue) {
        const items = [...v.entries.values()].map(convertYaksokToPythonLiteral)
        return `[${items.join(', ')}]`
    } else if (v instanceof PrimitiveValue) {
        return JSON.stringify(v.toPrint())
    } else if (v instanceof ReferenceStore) {
        throw new Error(
            'ReferenceStore should not be converted directly. Use executeFFI instead.',
        )
    }

    throw new Error('Unsupported value type: ' + v.constructor.name)
}

function convertPythonResultToYaksok(result: any): ValueType {
    if (
        result &&
        typeof result === 'object' &&
        typeof result.toJs === 'function'
    ) {
        console.debug('[Pyodide.convert] has toJs, returning ReferenceStore')

        return new ReferenceStore(result)
    }

    if (result == null) {
        return new NumberValue(0)
    } else if (typeof result === 'number') {
        return new NumberValue(result)
    } else if (typeof result === 'string') {
        return new StringValue(result)
    } else if (typeof result === 'boolean') {
        return new BooleanValue(result)
    } else if (Array.isArray(result)) {
        return new ListValue(result.map(convertPythonResultToYaksok))
    } else if (
        ArrayBuffer.isView(result) &&
        typeof (result as any).length === 'number'
    ) {
        // TypedArray (e.g., numpy ndarray or 0-dim result converted via toJs)
        const arr: any = result as any
        const jsArray = Array.from(arr)
        return new ListValue(jsArray.map(convertPythonResultToYaksok))
    }

    console.debug('[Pyodide.convert][fallback ReferenceStore]', {
        type: typeof result,
        ctor: (result as any)?.constructor?.name,
        keys:
            result && typeof result === 'object'
                ? Object.keys(result)
                : undefined,
    })
    return new ReferenceStore(result)
}
