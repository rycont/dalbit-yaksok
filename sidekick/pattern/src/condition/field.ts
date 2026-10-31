import {
    ChainShape,
    ChainShapeBase,
    KeyPlaceholder,
    MergeValues,
    signals,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import type { Chain } from './index.ts'

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(
        private entries: Record<
            string,
            Chain<unknown, ChainShapeBase<unknown>>
        >,
    ) {
        super()
    }

    static creater<const PrevChain extends Chain<unknown, ChainShapeBase>>(
        chain: PrevChain,
    ) {
        return <
            const ParentType,
            const EntryType extends
                (ChainShapeBase extends ChainShape<PrevChain>
                    ? {
                          [K in keyof Partial<ParentType>]: Chain<
                              ParentType[K],
                              ChainShapeBase
                          >
                      }
                    : {
                          [
                              K in keyof Partial<ChainShape<PrevChain>['Input']>
                          ]: Chain<
                              ChainShape<PrevChain>['Input'][K],
                              ChainShapeBase
                          >
                      }),
            const InputShape extends
                (ChainShapeBase extends ChainShape<PrevChain>
                    ? ParentType
                    : ChainShape<PrevChain>['Input']),
        >(
            entries: EntryType,
        ) => {
            return chain.pipe<
                ParentType,
                {
                    Input: InputShape & {
                        [K in keyof EntryType]: ChainShape<
                            EntryType[K]
                        >['Input']
                    }
                    Meta: ChainShape<PrevChain>['Meta']
                    Select: {
                        [
                            K in keyof EntryType as unknown extends ChainShape<
                                EntryType[K]
                            >['Select']
                                ? never
                                : K
                        ]: ChainShape<EntryType[K]>['Select'][keyof ChainShape<
                            EntryType[K]
                        >['Select']]
                    }
                }
            >(new FieldCondition(entries))
        }
    }

    override createStatement(
        accessor: string,
        requester: GlobalRequester,
    ): string {
        return Object.entries(this.entries)
            .map(([fieldName, field]) => {
                const subAccessor = `${accessor}.${fieldName}`
                try {
                    return field.buildField(subAccessor, requester)
                } catch (e) {
                    if (e instanceof signals.RequestFieldName) {
                        e.setName(fieldName)
                        return field.buildField(subAccessor, requester)
                    }

                    throw e
                }
            })
            .join('\n')
    }
}
