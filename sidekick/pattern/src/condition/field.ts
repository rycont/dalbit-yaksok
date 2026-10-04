import {
    ChainShape,
    ChainShapeBase,
    KeyPlaceholder,
    signals,
    UpdateShape,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import type { Chain } from './index.ts'

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(private entries: unknown) {
        super()
    }

    static creater<C extends Chain>(chain: C) {
        return <
            EntryType extends {
                [K in keyof Partial<ChainShape<C>['Input']>]: Chain<
                    ChainShapeBase<ChainShape<C>['Input'][K]>
                >
            },
        >(
            entries: EntryType,
        ) => {
            return chain.pipe<
                UpdateShape<
                    ChainShape<C>,
                    {
                        Input: ChainShape<C>['Input'] & {
                            [K in keyof EntryType]: ChainShape<
                                EntryType[K]
                            >['Input']
                        }

                        Select: {
                            [K in keyof EntryType]: {
                                [
                                    K2 in keyof ChainShape<
                                        EntryType[K]
                                    >['Select'] as KeyPlaceholder extends K2
                                        ? K
                                        : K2
                                ]: ChainShape<EntryType[K]>['Select'][K2]
                            }
                        }[keyof EntryType]
                    }
                >
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
