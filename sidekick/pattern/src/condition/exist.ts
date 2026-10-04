import { GlobalRequester, MatchCondition } from './base.ts'

export class ExistCondition extends MatchCondition {
    public static methodName = 'exist' as const

    constructor() {
        super()
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const statement = `if(!${accessor}) {
    return false
}`

        return statement
    }
}
