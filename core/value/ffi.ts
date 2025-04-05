import { ObjectValue, ValueType } from './base.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { RunnableObject } from './function.ts'

export class FFIObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '번역'

    constructor(
        public name: string,
        private code: string,
        private runtime: string,
        private declaredIn?: CodeFile,
    ) {
        super()
    }

    async run(args: Record<string, ValueType>): Promise<ValueType> {
        const result = await this.declaredIn!.runtime!.runFFI(
            this.runtime,
            this.code,
            args,
        )

        return result
    }
}
