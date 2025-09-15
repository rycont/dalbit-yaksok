import { ValueType } from './base.ts'

export class ReferenceStore extends ValueType {
    static override friendlyName = '참조값'

    constructor(public ref: unknown) {
        super()
    }

    override toPrint(): string {
        try {
            if (
                this.ref &&
                typeof this.ref === 'object' &&
                'toString' in this.ref &&
                typeof this.ref.toString === 'function'
            ) {
                return String(this.ref.toString())
            }
        } catch (_) {
            // ignore
        }
        try {
            return String(this.ref)
        } catch (_) {
            return '[참조값]'
        }
    }
}


