import {
    ErrorInFFIExecution,
    ListValue,
    NumberValue,
    PrimitiveValue,
    StringValue,
    BooleanValue,
    ValueType,
    type Extension,
    type ExtensionManifest,
    type FunctionInvokingParams,
} from '@dalbit-yaksok/core'

export class Pyodide implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: 'Python',
        },
    }

    private pyodide: any | null = null

    async init(): Promise<void> {
        const url = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs'
        const { loadPyodide } = await import(url)
        this.pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        })
    }

    async executeFFI(code: string, args: FunctionInvokingParams): Promise<ValueType> {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized')
        }

        try {
            if (code.startsWith('CALL ')) {
                const name = code.slice(5).trim()
                const ordered = Object.keys(args)
                    .sort((a, b) => Number(a) - Number(b))
                    .map((k) => args[k])

                const pyArgs = ordered.map(convertYaksokToPythonLiteral).join(', ')
                const pyCode = `${name}(${pyArgs})`
                const result = this.pyodide.runPython(pyCode)
                return convertPythonResultToYaksok(result)
            } else {
                this.pyodide.runPython(code)
                return new NumberValue(0)
            }
        } catch (e: any) {
            if (e instanceof ErrorInFFIExecution) throw e

            const message = e?.message ?? String(e)
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
    }

    throw new Error('Unsupported value type: ' + v.constructor.name)
}

function convertPythonResultToYaksok(result: any): ValueType {
    if (result && typeof result === 'object' && typeof result.toJs === 'function') {
        result = result.toJs({ create_proxies: false })
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
    }

    throw new ErrorInFFIExecution({
        message: '지원하지 않는 Python 반환값 타입: ' + typeof result,
    })
}


