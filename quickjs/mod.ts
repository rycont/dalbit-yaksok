import {
    newQuickJSWASMModuleFromVariant,
    newVariant,
    RELEASE_SYNC,
} from 'quickjs-emscripten'
import type { QuickJSContext, QuickJSWASMModule } from 'quickjs-emscripten-core'

import {
    ErrorInFFIExecution,
    ListValue,
    NumberValue,
    PrimitiveValue,
    StringValue,
    ValueType,
    type Extension,
    type ExtensionManifest,
    type FunctionInvokingParams,
} from '@dalbit-yaksok/core'
import { dim } from './util.ts'

export class QuickJS implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: 'QuickJS',
        },
    }

    private instance: QuickJSWASMModule | null = null

    constructor(
        private functions: Record<string, (...args: any[]) => any> = {},
    ) {}

    async init(): Promise<void> {
        const wasmPath =
            'https://unpkg.com/@jitl/quickjs-wasmfile-release-sync@0.31.0/dist/emscripten-module.wasm'

        const wasmModule = await WebAssembly.compileStreaming(fetch(wasmPath))

        const variant = newVariant(RELEASE_SYNC, {
            wasmModule,
        })

        this.instance = await newQuickJSWASMModuleFromVariant(variant)
    }

    public executeFFI(
        bodyCode: string,
        args: FunctionInvokingParams,
    ): ValueType {
        const wrappedCode = createWrapperCodeFromFFICall(bodyCode, args)
        const vm = this.createContext()

        const result = vm.evalCode(wrappedCode)

        if (result.error) {
            const error = vm.dump(result.error) as QuickJSErrorData
            result.error.dispose()

            throw new QuickJSInternalError(error)
        } else {
            const resultValue = vm.dump(result.value)
            result.value.dispose()

            const yaksokValue = convertJSDataIntoYaksok(resultValue)

            return yaksokValue
        }
    }

    private createContext() {
        if (!this.instance) {
            throw new QuickJSNotInitializedError()
        }

        const context = this.instance.newContext()

        for (const [name, func] of Object.entries(this.functions)) {
            const handle = context.newFunction(name, (...args: any[]) => {
                const nativeArgs = args.map(context.dump)
                const result = func(nativeArgs)

                return convertJSDataIntoQuickJSData(result, context)
            })
            context.setProp(context.global, name, handle)
        }

        return context
    }
}

function createWrapperCodeFromFFICall(
    bodyCode: string,
    args: Record<string, any>,
) {
    const parameters = Object.keys(args)
    const parameterValues = Object.values(args).map(
        convertYaksokDataIntoQuickJSData,
    )

    return `((${parameters.join(
        ', ',
    )}) => {${bodyCode}})(${parameterValues.join(', ')})`
}

function convertYaksokDataIntoQuickJSData(data: ValueType) {
    if (data instanceof StringValue) {
        return `"${data.value}"`
    } else if (data instanceof ListValue) {
        if (data.entries.size === 0) {
            return '[]'
        }

        const keys = Array.from(data.entries.keys())
        const maxKey = Math.max(...keys)

        const targetArrayElements = new Array(maxKey + 1)

        for (let i = 0; i <= maxKey; i++) {
            const value = data.entries.get(i)
            if (value !== undefined) {
                targetArrayElements[i] = convertYaksokDataIntoQuickJSData(value)
            } else {
                targetArrayElements[i] = 'null'
            }
        }
        return `[${targetArrayElements.join(', ')}]`
    } else if (data instanceof PrimitiveValue) {
        return data.value
    } else {
        throw new Error(
            `Cannot convert unsupported data type to JS String Literal: ${data.constructor.name}`,
        )
    }
}

function convertJSDataIntoQuickJSData(data: any, context: QuickJSContext) {
    if (typeof data === 'string') {
        return context.newString(data)
    } else if (typeof data === 'number') {
        return context.newNumber(data)
    } else if (Array.isArray(data)) {
        const arrayData = [...data]

        const array = context.newArray()
        for (const item in arrayData) {
            context.setProp(
                array,
                item,
                convertJSDataIntoQuickJSData(arrayData[item], context),
            )
        }

        return array
    } else if (typeof data === 'object') {
        const object = context.newObject()

        for (const [key, value] of Object.entries(data)) {
            context.setProp(
                object,
                key,
                convertJSDataIntoQuickJSData(value, context),
            )
        }

        return object
    }

    throw new Error('Unsupported data type: ' + typeof data)
}

function convertJSDataIntoYaksok(data: unknown): ValueType {
    if (typeof data === 'string') {
        return new StringValue(data)
    } else if (typeof data === 'number') {
        return new NumberValue(data)
    } else if (Array.isArray(data)) {
        return new ListValue(data.map(convertJSDataIntoYaksok))
    }

    throw new Error('Unsupported data type: ' + typeof data)
}

interface QuickJSErrorData {
    name: string
    message: string
    stack: string
}

export class QuickJSInternalError extends ErrorInFFIExecution {
    constructor(error: QuickJSErrorData) {
        let output = ''

        output += error.message + '\n\n'

        output += '┌─────\n'
        output += error.stack
            .split('\n')
            .filter((line) => line.length)
            .map((line, index) => `│ ${dim(index + 1)}${line}`)
            .join('\n')
        output += '\n└─────'

        super({
            message: output,
        })

        this.name = error.name
        this.stack = error.stack
    }
}

export class QuickJSNotInitializedError extends Error {
    constructor() {
        super('QuickJS instance is not initialized yet')
    }
}
