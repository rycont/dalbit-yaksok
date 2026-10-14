import { Chain } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { ChainShape, UpdateShape } from '../common.ts'

export class EnumCondition extends MatchCondition {
    public static methodName = 'enum' as const

    constructor(private options: string[]) {
        super()
    }

    public static creater<C extends Chain>(chain: C) {
        return <const Options extends string[]>(options: Options) => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: Options[number]
                    }
                >
            >(new EnumCondition(options))
        }
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
