import { SIGNALS } from './common.ts'

export class FieldWorks<const _ extends string | true | null = null> {
    private selectName: string | true | null = null

    constructor(private condition?: (accessor: string) => string) {}

    public createStatement(
        accessor: string,
        selectJarName: () => string,
    ): string {
        if (this.selectName === true) {
            throw SIGNALS.REQUEST_FOR_FIELD_NAME
        }

        const selector = this.selectName
            ? `${selectJarName()}["${this.selectName}"] = ${accessor}`
            : null

        if (!this.condition) {
            return selector || ''
        }

        return `if(!(${this.condition(accessor)})) {
    return false
}
    
${selector || ''}`
    }

    public select(): FieldWorks<true>
    public select<const T extends string>(name: T): FieldWorks<T>
    public select(name?: string) {
        this.selectName = name || true
        return this
    }
}

export const fields = {
    literal: (value: unknown) => (compareTarget: string) => {
        const argType = typeof value

        if (argType === 'string') {
            return `${compareTarget} === "${value}"`
        }

        if (argType === 'number') {
            return `${compareTarget} === ${value}`
        }

        throw new Error('Not supported literal:')
    },
}
