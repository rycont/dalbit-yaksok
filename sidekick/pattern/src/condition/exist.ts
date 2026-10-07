import {
    ChainShape,
    TypePlaceholderExists,
    UpdateShape,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import { Chain } from './index.ts'

export class ExistCondition extends MatchCondition {
    public static methodName = 'exist' as const

    constructor() {
        super()
    }

    public static creater<C extends Chain>(chain: C) {
        return () => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: ChainShape<C>['Input'] extends unknown
                            ? TypePlaceholderExists
                            : ChainShape<C>['Input']
                    }
                >
            >(new ExistCondition())
        }
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
