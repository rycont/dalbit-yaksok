import { GlobalRequester, MatchCondition } from './base.ts'

export class SelectCondition extends MatchCondition {
    public static methodName = 'select' as const

    constructor(private name: string) {
        super()
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        return `${requester.selectJar()}.${this.name} = ${accessor}`
    }
}
