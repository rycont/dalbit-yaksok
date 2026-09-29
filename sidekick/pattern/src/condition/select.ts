import { signals } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'

export class SelectCondition extends MatchCondition {
    public static methodName = 'select' as const

    constructor(
        private name?: string,
        private refine?: () => unknown,
    ) {
        super()
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        if (!this.name) {
            throw new signals.RequestFieldName((fieldName) => {
                this.name = fieldName
            })
        }

        const valueCode = this.refine
            ? `${requester.newArg(this.refine)}(${accessor})`
            : accessor

        return `${requester.selectJar()}.${this.name} = ${valueCode}`
    }
}
