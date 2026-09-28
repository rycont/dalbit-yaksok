import { MatchCondition } from './base.ts'

export class LiteralCondition extends MatchCondition {
    constructor(private literal: string | number | boolean) {
        super()
    }

    override createStatement(accessor: string): string {
        const condition =
            typeof this.literal === 'string'
                ? `${accessor} === "${this.literal}"`
                : `${accessor} === ${this.literal}`

        const statement = `if(!${condition}) {
    return false
}`

        return statement
    }
}
