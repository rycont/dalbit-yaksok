import {
    DisposableSuccess,
    newQuickJSWASMModuleFromVariant,
    newVariant,
    RELEASE_SYNC,
} from 'quickjs-emscripten'
import type {
    QuickJSContext,
    QuickJSHandle,
    QuickJSWASMModule,
} from 'quickjs-emscripten-core'

import {
    ErrorInFFIExecution,
    type Extension,
    ListValue,
    NumberValue,
    PrimitiveValue,
    StringValue,
    BooleanValue,
    ValueType,
} from '@dalbit-yaksok/core'
import { dim } from './util.ts'

const BLOB_LOAD_PATH =
    'https://unpkg.com/@jitl/quickjs-wasmfile-release-sync@0.31.0/dist/emscripten-module.wasm'
const BLOB_CACHE_KEY = `quickjs-blob-cache-key:${BLOB_LOAD_PATH}`

export async function quickJS(
    functions?: Record<string, (...args: unknown[]) => unknown>,
): Promise<Extension> {
    const wasmModule = await WebAssembly.compile(await loadBytes())

    const variant = newVariant(RELEASE_SYNC, {
        wasmModule,
    })

    const instance = await newQuickJSWASMModuleFromVariant(variant)

    return {
        capabilties: {
            FFI: [
                {
                    runtimeId: 'QuickJS',
                    async run(
                        bodyCode: string,
                        args: Map<string, ValueType>,
                    ): Promise<ValueType> {
                        const wrappedCode = createWrapperCodeFromFFICall(
                            bodyCode,
                            args,
                        )
                        const vm = createContext(instance, functions)

                        const result = vm.evalCode(wrappedCode)

                        if (result instanceof DisposableSuccess) {
                            const resultValue = vm.dump(result.value)
                            result.value.dispose()

                            const yaksokValue =
                                convertJSDataIntoYaksok(resultValue)

                            return yaksokValue
                        } else {
                            const error = vm.dump(result.error)
                            result.error.dispose()

                            throw new QuickJSInternalError(error)
                        }
                    },
                },
            ],
        },
    }
}

async function loadBytes(): Promise<Uint8Array<ArrayBuffer>> {
    const cached = localStorage.getItem(BLOB_CACHE_KEY)

    if (cached) {
        return Uint8Array.fromBase64(cached)
    }

    const wasmResource = await fetch(BLOB_LOAD_PATH)
    const loaded = await wasmResource.bytes()

    localStorage.setItem(BLOB_CACHE_KEY, loaded.toBase64())

    return loaded
}

function createContext(
    instance: QuickJSWASMModule,
    functions: Record<string, (...args: unknown[]) => unknown> = {},
) {
    if (!instance) {
        throw new QuickJSNotInitializedError()
    }

    const context = instance.newContext()

    for (const [name, func] of Object.entries(functions)) {
        const handle = context.newFunction(name, (...args: QuickJSHandle[]) => {
            const nativeArgs = args.map((v) => context.dump(v))
            const result = func(nativeArgs)

            return convertJSDataIntoQuickJSData(result, context)
        })
        context.setProp(context.global, name, handle)
    }

    return context
}

function createWrapperCodeFromFFICall(
    bodyCode: string,
    args: Map<string, ValueType>,
) {
    const parameters = args.keys().toArray()
    const parameterValues = args
        .values()
        .map(convertYaksokDataIntoQuickJSData)
        .toArray()

    return `((${parameters.join(
        ', ',
    )}) => {${bodyCode}})(${parameterValues.join(', ')})`
}

function convertYaksokDataIntoQuickJSData(data: ValueType) {
    if (data instanceof StringValue) {
        return JSON.stringify(data.value)
    } else if (data instanceof ListValue) {
        if (data.entries.size === 0) {
            return '[]'
        }

        const keys = Array.from(data.entries.keys())
        const maxKey = Math.max(...keys)

        const targetArrayElements = Array.from<string>({ length: maxKey + 1 })

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

function convertJSDataIntoQuickJSData(
    data: unknown,
    context: QuickJSContext,
): QuickJSHandle {
    if (typeof data === 'string') {
        return context.newString(data)
    } else if (typeof data === 'number') {
        return context.newNumber(data)
    } else if (typeof data === 'boolean') {
        return data ? context.true : context.false
    } else if (Array.isArray(data)) {
        const arrayData = [...data]

        const array = context.newArray()
        for (const [index, item] of arrayData.entries()) {
            context.setProp(
                array,
                index,
                convertJSDataIntoQuickJSData(item, context),
            )
        }

        return array
    } else if (typeof data === 'object' && data !== null) {
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
    } else if (typeof data === 'boolean') {
        return new BooleanValue(data)
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
