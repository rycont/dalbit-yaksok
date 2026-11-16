import {
    ObjectValue,
    type Scope,
    type ValueType,
    type RunnableObject,
    RuleList,
} from '@dalbit-yaksok/core'

export class FFIObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '번역'

    public paramNames: string[] = []

    constructor(
        public name: string,
        private code: string,
        private runtime: string,
        public invokeRules: RuleList,
        private declaredScope: Scope,
    ) {
        super()
    }

    async run(args: Map<string | symbol, ValueType>): Promise<ValueType> {
        const result = await this.declaredScope.session.runFFI(
            this.runtime,
            this.code,
            args,
            this.declaredScope,
        )

        return result
    }
}
