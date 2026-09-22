import {
    CodeFile,
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
        public invokeRule: Rule,
        private declaredIn: CodeFile,
        public options: {
            dotReceiverTypeNames?: string[]
        } = {},
    ) {
        super()
    }

    async run(
        args: Record<string, ValueType>,
        callerScope: Scope,
    ): Promise<ValueType> {
        const result = await this.declaredIn!.session!.runFFI(
            this.runtime,
            this.code,
            args,
            callerScope,
        )

        return result
    }
}
