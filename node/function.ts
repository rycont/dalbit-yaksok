import { NotDefinedIdentifierError } from '../error/index.ts'
import { CallFrame } from '../runtime/callFrame.ts'
import { Scope } from '../runtime/scope.ts'
import { ReturnSignal } from '../runtime/signals.ts'
import { Evaluable, Executable, type ValueTypes } from './base.ts'
import type { Block } from './block.ts'
import { NumberValue } from './primitive.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class DeclareFunction extends Executable {
    name: string
    body: Block

    constructor(props: { body: Block; name: string }) {
        super()

        this.name = props.name
        this.body = props.body
    }

    override execute(scope: Scope) {
        scope.setFunction(this.name, this)
    }

    run(scope: Scope, _callFrame: CallFrame): ValueTypes {
        const callFrame = new CallFrame(this, _callFrame)

        try {
            this.body.execute(scope, callFrame)
        } catch (e) {
            if (!(e instanceof ReturnSignal)) {
                throw e
            }
        }

        return this.getReturnValue(scope)
    }

    getReturnValue(scope: Scope): ValueTypes {
        try {
            return scope.getVariable('결과')
        } catch (e) {
            if (e instanceof NotDefinedIdentifierError) {
                return DEFAULT_RETURN_VALUE
            }

            throw e
        }
    }
}

export interface Params {
    [key: string]: Evaluable
}

export class FunctionInvoke extends Evaluable {
    private name: string
    private params: Params

    constructor(props: { name: string; params: Params }) {
        super()

        this.name = props.name!
        this.params = props.params
    }

    override execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        const args = getParams(this.params, scope, callFrame)

        const result = this.invoke(scope, callFrame, args)
        return result
    }

    invoke(
        scope: Scope,
        callFrame: CallFrame,
        args: { [key: string]: ValueTypes } | null,
    ) {
        const func = scope.getFunction(this.name)
        const childScope = new Scope({
            parent: scope,
            initialVariable: args,
        })

        const result = func.run(childScope, callFrame)

        return result
    }
}

export function getParams(params: Params, scope: Scope, callFrame: CallFrame) {
    const args: { [key: string]: ValueTypes } = {}

    for (const key in params) {
        const value = params[key]
        args[key] = value.execute(scope, callFrame)
    }

    return args
}
