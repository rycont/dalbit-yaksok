import { getQuickJS } from 'npm:quickjs-emscripten@0.31.0'
import type {
    QuickJSWASMModule,
    QuickJSContext,
} from 'npm:quickjs-emscripten-core@0.31.0'
import type { Params } from '../../node/function.ts'
import {
    List,
    NumberValue,
    StringValue,
    type PrimitiveTypes,
    type ValueTypes,
} from '../../node/index.ts'
import { bold, dim } from '../../error/common.ts'

export class QuickJS {
    instance: QuickJSWASMModule | null = null

    constructor(
        private functions: Record<string, (...args: any[]) => any> = {},
    ) {}

    async init() {
        this.instance = await getQuickJS()
    }

    run(bodyCode: string, args: Params) {
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

function convertYaksokDataIntoQuickJSData(data: PrimitiveTypes) {
    if (data instanceof StringValue) {
        return `"${data.value}"`
    } else {
        return data.value
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

function convertJSDataIntoYaksok(data: unknown): ValueTypes {
    if (typeof data === 'string') {
        return new StringValue(data)
    } else if (typeof data === 'number') {
        return new NumberValue(data)
    } else if (Array.isArray(data)) {
        return new List(data.map(convertJSDataIntoYaksok))
    }

    throw new Error('Unsupported data type: ' + typeof data)
}

interface QuickJSErrorData {
    name: string
    message: string
    stack: string
}

export class QuickJSInternalError extends Error {
    constructor(error: QuickJSErrorData) {
        super(error.message)

        this.name = error.name
        this.stack = error.stack

        let output = ''

        output += '─────\n\n'
        output += `🚨  ${bold(`[QuickJS] 문제가 발생했어요`)}  🚨` + '\n\n'
        output += '> ' + error.message + '\n\n'

        output += '┌─────\n'

        output += error.stack
            .split('\n')
            .filter((line) => line.length)
            .map((line, index) => `│ ${dim(index + 1)}${line}`)
            .join('\n')

        output += '\n└─────\n'

        console.error(output)
    }
}

export class QuickJSNotInitializedError extends Error {
    constructor() {
        super('QuickJS instance is not initialized yet')
    }
}
