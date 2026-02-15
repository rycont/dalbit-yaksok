import { ObjectValue, ValueType } from './base.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { RunnableObject } from './function.ts'
import { Scope } from '../executer/scope.ts'

export class FFIObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '번역'

    public paramNames: string[] = []

    constructor(
        public name: string,
        private code: string,
        private runtime: string,
        private declaredIn?: CodeFile,
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
