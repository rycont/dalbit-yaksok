import { Scope } from '../executer/scope.ts'
import type { Evaluable } from '../node/base.ts'
import { ObjectValue, type ValueType } from './base.ts'
import type { RunnableObject } from './function.ts'

export class LambdaFunctionValue extends ObjectValue implements RunnableObject {
    static override friendlyName = '람다'

    public name = '람다'

    constructor(
        public paramNames: string[],
        private body: Evaluable,
        private declaredScope?: Scope,
    ) {
        super()
    }

    async run(
        args: Record<string, ValueType>,
        callSiteScope?: Scope,
    ): Promise<ValueType> {
        const lexicalScope = this.declaredScope ?? callSiteScope
        const previousDepth =
            callSiteScope?.callStackDepth ?? lexicalScope?.callStackDepth ?? 0

        const lambdaScope = new Scope({
            parent: lexicalScope,
            initialVariable: args,
            callStackDepth: previousDepth + 1,
            callerNode: this.body,
        })

        return await this.body.execute(lambdaScope)
    }
}
