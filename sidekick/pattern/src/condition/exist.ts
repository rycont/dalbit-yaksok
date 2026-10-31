import { ChainShapeBase } from '@dalbit-yaksok/pattern'
import { ChainShape, UpdateShape } from '../common.ts'
import { MatchCondition } from './base.ts'
import { Chain } from './index.ts'

export class ExistCondition extends MatchCondition {
    public static methodName = 'exist' as const

    constructor() {
        super()
    }

    public static creater<C extends Chain<unknown, ChainShapeBase>>(chain: C) {
        return <const ParentType>() => {
            return chain.pipe<
                ParentType,
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: NonNullable<ChainShape<C>['Input']>
                    }
                >
            >(new ExistCondition())
        }
    }

    public override createStatement(accessor: string): string {
        const statement = `if(!${accessor}) {
    return false
}`

        return statement
    }
}
