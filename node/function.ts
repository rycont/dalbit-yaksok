import {
    NotDefinedFunctionError,
    NotDefinedVariableError,
    NotEvaluableParameterError,
} from '../error/index.ts'
import { CallFrame } from '../runtime/callFrame.ts'
import { Scope } from '../runtime/scope.ts'
import { ReturnSignal } from '../runtime/signals.ts'
import { Evaluable, Executable, ValueTypes } from './base.ts'
import { Block } from './block.ts'
import { Node } from './index.ts'
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

    execute(scope: Scope) {
        scope.setFunction(this.name, this)
    }

    run(scope: Scope, _callFrame: CallFrame) {
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

    getReturnValue(scope: Scope) {
        try {
            return scope.getVariable('결과')
        } catch (e) {
            if (e instanceof NotDefinedVariableError) {
                return DEFAULT_RETURN_VALUE
            }

            throw e
        }
    }
}

export interface Params {
    [key: string]: Node
}

export class FunctionInvoke extends Evaluable {
    private name: string
    private params: Params | null

    constructor(props: { name: string; params?: Record<string, Evaluable> }) {
        super()

        this.name = props.name!
        this.params = props.params || null
    }

    execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        const args = this.params && getParams(this.params, scope, callFrame)

        try {
            const result = this.invoke(scope, callFrame, args)
            return result || DEFAULT_RETURN_VALUE
        } catch (e) {
            if (e instanceof NotDefinedFunctionError) {
                e.position = this.position
            }

            throw e
        }
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

        assertEvaluable(value)
        args[key] = value.execute(scope, callFrame)
    }

    return args
}

function assertEvaluable(node: Node): asserts node is Evaluable {
    if (node instanceof Evaluable) return

    throw new NotEvaluableParameterError({
        position: node.position,
        resource: {
            node,
        },
    })
}
