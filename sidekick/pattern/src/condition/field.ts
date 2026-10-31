import { ChainShape, ChainShapeBase, MergeValues, signals } from '../common.ts'
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

    static creater<const C extends Chain<unknown, ChainShapeBase>>(chain: C) {
        return <
            const ParentType,
            const EntryType extends {
                [K in keyof Partial<ChainShape<C>['Input']>]: Chain<
                    ChainShape<C>['Input'][K],
                    ChainShapeBase
                >
            },
            const _R extends (unknown extends ChainShape<C>['Input']
                ? Chain<ParentType, ChainShapeBase<ParentType>>
                : C),
        >(
            entries: EntryType,
        ) => {
            return chain.pipe<
                ParentType,
                {
                    Input: ParentType & {
                        [K in keyof EntryType]: ChainShape<
                            EntryType[K]
                        >['Input']
                    }
                    Meta: unknown
                    Select: ChainShape<C>['Select'] &
                        MergeValues<{
                            [K in keyof EntryType]: ChainShape<
                                EntryType[K]
                            >['Select']
                        }>
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
