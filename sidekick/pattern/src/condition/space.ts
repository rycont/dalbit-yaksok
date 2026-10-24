import { Chain, ChainShapeBase } from '@dalbit-yaksok/pattern'
import { MatchCondition } from './base.ts'
export class SpaceCondition extends MatchCondition {
    public static methodName = 'space' as const

    public override createStatement(): string {
        return ''
    }

    static creater<C extends Chain<unknown, ChainShapeBase<unknown>>>(chain: C) {
        return <const R>() => {
            return chain.pipe<ChainShapeBase<unknown, unknown, unknown, R>>(
                new SpaceCondition(),
            )
        }
    }
}
