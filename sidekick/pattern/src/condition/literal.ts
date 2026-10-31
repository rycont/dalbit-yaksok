import { ChainShapeBase } from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import { Chain } from './index.ts'

export class LiteralCondition extends MatchCondition {
    public static methodName = 'literal' as const

    constructor(private literal: string | number | boolean) {
        super()
    }

    static creater<C extends Chain<unknown, ChainShapeBase>>(chain: C) {
        return <
            const ParentType,
            InputLiteral extends string | number | boolean,
        >(
            literal: InputLiteral,
        ) => {
            return chain.pipe<
                ParentType,
                {
                    Input: InputLiteral
                    Meta: unknown
                    Select: unknown
                }
            >(new LiteralCondition(literal))
        }
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
