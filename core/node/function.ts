import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { FunctionObject, RunnableObject } from '../value/function.ts'
import { Evaluable, Executable } from './base.ts'
import { ValueType } from '../value/base.ts'
import { Scope } from '../executer/scope.ts'

import type { FunctionInvokingParams } from '../constant/type.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { Block } from './block.ts'
import { YaksokError } from '../error/common.ts'
import { NumberValue } from '../value/primitive.ts'

export class DeclareFunction extends Executable {
    static override friendlyName = '새 약속 만들기'

    name: string
    body: Block

    constructor(
        props: { body: Block; name: string },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name
        this.body = props.body
    }

    override execute(scope: Scope): Promise<void> {
        const functionObject = new FunctionObject(this.name, this.body, scope)
        scope.addFunctionObject(functionObject)

        return Promise.resolve()
    }

    override validate(scope: Scope) {
        scope.addFunctionObject(new FunctionObject(this.name, this.body, scope))

        return []
    }
}

export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    public name: string
    public params: Record<string, Evaluable>

    constructor(
        props: { name: string; params: Record<string, Evaluable> },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name!
        this.params = props.params
    }

    override async execute(
        scope: Scope,
        args?: FunctionInvokingParams,
    ): Promise<ValueType> {
        if (!args) {
            args = await evaluateParams(this.params, scope)
        }

        const functionObject = scope.getFunctionObject(this.name)
        const returnValue = await functionObject.run(args)

        assertValidReturnValue(this, returnValue)

        return returnValue
    }

    get value(): string {
        return this.name
    }

    override validate(scope: Scope) {
        const errors: YaksokError[] = []

        let runnableObject: RunnableObject | undefined

        try {
            runnableObject = scope.getFunctionObject(this.name)
        } catch (error) {
            if (error instanceof YaksokError) {
                errors.push(error)
            } else {
                throw error
            }
        }

        const argsError = Object.values(this.params)
            .map((param) => param.validate(scope))
            .flat()
            .filter((error): error is YaksokError => !!error)

        if (argsError.length > 0) {
            errors.push(...argsError)
        }

        if (runnableObject instanceof FunctionObject) {
            const dummyArgs = Object.fromEntries(
                Object.keys(this.params).map((key) => [key, new ValueType()]),
            )

            const functionErrors = runnableObject.validate(dummyArgs, scope)
            if (functionErrors) {
                errors.push(...functionErrors)
            }
        }

        if (errors.length > 0) {
            return errors
        }

        return null
    }
}

export async function evaluateParams(
    params: {
        [key: string]: Evaluable
    },
    scope: Scope,
): Promise<{ [key: string]: ValueType }> {
    const args: FunctionInvokingParams = {}

    for (const key in params) {
        const value = params[key]
        args[key] = await value.execute(scope)
    }

    return args
}
