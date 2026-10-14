import { Chain } from '@dalbit-yaksok/pattern'
import { MatchCondition } from './base.ts'
import {
    ChainShape,
    Fallback,
    TypePlaceholder,
    UpdateShape,
    ValueTraits,
} from '../common.ts'

export class SpaceCondition extends MatchCondition {
    public static methodName = 'space' as const

    public override createStatement(): string {
        return ''
    }

    static creater<C extends Chain>(chain: C) {
        return <R>() => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: ChainShape<C>['Input'],
                        ParentInput: R
                    }
                >
            >(new SpaceCondition())
        }
    }
}
