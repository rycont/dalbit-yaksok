import { Chain, ChainShapeBase } from '@dalbit-yaksok/pattern'
import { MatchCondition } from './base.ts'
import { ChainShape } from '../common.ts'
export class SpaceCondition extends MatchCondition {
    public static methodName = 'space' as const

    public override createStatement(): string {
        return ''
    }

    static creater<
        const PrevChain extends Chain<unknown, ChainShapeBase<unknown>>,
    >(chain: PrevChain) {
        return <
            const ParentType,
            const InputShape extends
                (ChainShapeBase extends ChainShape<PrevChain>
                    ? ParentType
                    : ChainShape<PrevChain>['Input']),
        >() => {
            return chain.pipe<
                ParentType,
                ChainShapeBase<InputShape[], unknown, unknown>
            >(new SpaceCondition(), {
                spread: true,
            })
        }
    }
}
