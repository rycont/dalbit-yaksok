import type { Chain } from '@dalbit-yaksok/pattern'
import {
    ChainShape,
    Fallback,
    KeyPlaceholder,
    signals,
    TypePlaceholder,
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

    static creater<C extends Chain>(chain: C) {
        return <T extends string>(name?: T, refine?: () => unknown) => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Select: ChainShape<C>['Select'] & {
                            [
                                key in string extends T ? KeyPlaceholder : T
                            ]: Fallback<ChainShape<C>['Input'], TypePlaceholder>
                        }
                    }
                >
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
