import { GlobalRequester, MatchCondition } from './base.ts'

export class FieldCondition extends MatchCondition {
    static create(entries: Record<string, MatchCondition>) {
        return new FieldCondition(entries)
    }

    constructor(private entries: Record<string, MatchCondition>) {
        super()
    }

    override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        return Object.entries(this.entries)
            .map(([fieldName, field]) => {
                const subAccessor = `${accessor}.${fieldName}`
                return field.toCode(subAccessor, requester)
            })
            .join('\n')
    }
}
