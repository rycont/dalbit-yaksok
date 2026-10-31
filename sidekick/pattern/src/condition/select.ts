import type { Chain } from '@dalbit-yaksok/pattern'
import {
    ChainShape,
    ChainShapeBase,
    KeyPlaceholder,
    signals,
    UpdateShape,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'

export class SelectCondition extends MatchCondition {
    public static methodName = 'select' as const

    constructor(
        private name?: string,
        private refine?: () => unknown,
    ) {
        super()
    }

    static creater<const PrevChain extends Chain<unknown, ChainShapeBase>>(
        chain: PrevChain,
    ) {
        return <
            const ParentType,
            const C extends (unknown extends ChainShape<PrevChain>['Input']
                ? Chain<ParentType, ChainShapeBase<ParentType>>
                : PrevChain),
            T extends string,
        >(
            name?: T,
            refine?: () => unknown,
        ) => {
            return chain.pipe<
                ParentType,
                {
                    Select: {
                        [
                            K in T extends undefined ? KeyPlaceholder : T
                        ]: ChainShape<C>['Input']
                    }
                    Input: ChainShape<C>['Input']
                    Meta: ChainShape<C>['Meta']
                }
            >(new SelectCondition(name, refine))
        }
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
