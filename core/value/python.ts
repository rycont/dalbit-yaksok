import { ValueType } from './base.ts'

export class ReferenceStore extends ValueType {
    static override friendlyName = '참조값'

    constructor(public ref: any) {
        super()
    }

    override toPrint(): string {
        try {
            if (
                this.ref &&
                typeof this.ref === 'object' &&
                typeof this.ref.toString === 'function'
            ) {
                return String(this.ref.toString())
            }
        } catch {
            // ignore
        }
        try {
            return String(this.ref)
        } catch {
            return '[참조값]'
        }
    }
}
