import type { Chain } from '@dalbit-yaksok/pattern'
import { ChainShape, KeyPlaceholder, signals, UpdateShape } from '../common.ts'
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
                        Select: string extends T
                            ? {
                                  [
                                      key in KeyPlaceholder
                                  ]: ChainShape<C>['Input']
                              }
                            : {
                                  [key in T]: ChainShape<C>['Input']
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
