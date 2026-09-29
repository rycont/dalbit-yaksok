import { GlobalRequester, MatchCondition } from './base.ts'

export class LiteralCondition extends MatchCondition {
    public static methodName = 'literal' as const

    constructor(private literal: string | number | boolean) {
        super()
    }

    override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const argName = requester.newArg(this.literal)

        const statement = `if(!(${accessor} === ${argName})) {
    return false
}`

        return statement
    }
}
