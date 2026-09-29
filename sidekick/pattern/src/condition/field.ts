import { signals } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import type { Chain } from './index.ts'

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    static create(entries: Record<string, Chain<unknown, unknown>>) {
        return new FieldCondition(entries)
    }

    constructor(private entries: Record<string, Chain<unknown, unknown>>) {
        super()
    }

    override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        return Object.entries(this.entries)
            .map(([fieldName, field]) => {
                const subAccessor = `${accessor}.${fieldName}`
                try {
                    return field.buildField(subAccessor, requester)
                } catch (e) {
                    if (e instanceof signals.RequestFieldName) {
                        e.setName(fieldName)
                        return field.buildField(subAccessor, requester)
                    }

                    throw e
                }
            })
            .join('\n')
    }
}
