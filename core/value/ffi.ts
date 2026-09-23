import {
    ObjectValue,
    Rule,
    RunnableObject,
    Scope,
    ValueType,
} from '@dalbit-yaksok/core'

export class FFIObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '번역'

    public paramNames: string[] = []

    constructor(
        public name: string,
        private code: string,
        private runtime: string,
        public invokeRules: Rule[],
        private declaredScope: Scope,
    ) {
        super()
    }

    async run(args: Record<string, ValueType>): Promise<ValueType> {
        const result = await this.declaredScope.session.runFFI(
            this.runtime,
            this.code,
            args,
            this.declaredScope,
        )

        return result
    }
}
