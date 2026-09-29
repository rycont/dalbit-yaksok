import { GlobalRequester, MatchCondition } from './base.ts'

export class EnumCondition extends MatchCondition {
    public static methodName = 'enum' as const

    constructor(private options: string[]) {
        super()
    }

    override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const setName = requester.newArg(new Set(this.options))

        const statement = `if(!(${setName}.has(${accessor}))) {
    return false
}`

        return statement
    }
}
