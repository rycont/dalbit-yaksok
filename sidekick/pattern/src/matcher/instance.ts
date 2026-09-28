import { ClassType } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'

export class InstanceCondition extends MatchCondition {
    static create(classType: ClassType) {
        return new InstanceCondition(classType)
    }

    constructor(public classType: ClassType) {
        super()
    }

    public override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        const argName = requester.newArg(this.classType)

        const statement = `if(!(${accessor}) instanceof ${argName}) {
    return false
}`

        return statement
    }
}
