import { Evaluable, Executable } from './base.ts'

import { Scope } from '../executer/scope.ts'

import type { FunctionInvokingParams } from '../constant/type.ts'
import type { Block } from './block.ts'
import { FunctionObject } from '../value/function.ts'
import { FFIResultTypeIsNotForYaksokError } from '../error/ffi.ts'
import { ValueType } from '../value/base.ts'
import type { Token } from '../prepare/tokenize/token.ts'

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

function assertValidReturnValue(node: FunctionInvoke, returnValue: ValueType) {
    if (returnValue instanceof ValueType) {
        return
    }

    throw new FFIResultTypeIsNotForYaksokError({
        ffiName: node.name,
        value: returnValue,
        tokens: node.tokens,
    })
}
