import {
    ChainShape,
    ChainShapeBase,
    KeyPlaceholder,
    Prettify,
    signals,
    TypePlaceholder,
    TypePlaceholderExists,
    UpdateShape,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import type { Chain } from './index.ts'

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
    x: infer R,
) => any
    ? R
    : never

type MergeValues<T> = UnionToIntersection<T[keyof T]>

type SelectFromEntries<EntryType, OriginChain> = Prettify<
    MergeValues<{
        [
            K in keyof EntryType as [unknown] extends ChainShape<
                EntryType[K]
            >['Select']
                ? never
                : K
        ]: {
            [
                K2 in keyof ChainShape<
                    EntryType[K]
                >['Select'] as K2 extends KeyPlaceholder ? K : K2
            ]: ChainShape<EntryType[K]>['Select'][K2] extends TypePlaceholder
                ? K extends keyof ChainShape<OriginChain>['Input']
                    ? ChainShape<OriginChain>['Input'][K]
                    : never
                : ChainShape<
                        EntryType[K]
                    >['Select'][K2] extends TypePlaceholderExists
                  ? K extends keyof ChainShape<OriginChain>['Input']
                      ? NonNullable<ChainShape<OriginChain>['Input'][K]>
                      : never
                  : ChainShape<EntryType[K]>['Select'][K2]
        }
    }>
>

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(private entries: unknown) {
        super()
    }

    static creater<C extends Chain>(chain: C) {
        return <
            EntryType extends {
                [K in keyof Partial<ChainShape<C>['Input']>]: Chain<
                    ChainShapeBase<
                        | ChainShape<C>['Input'][K]
                        | TypePlaceholder
                        | TypePlaceholderExists
                    >
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
                            [
                                K in keyof EntryType as undefined extends EntryType[K]
                                    ? never
                                    : K
                            ]: ChainShape<EntryType[K]>['Input']
                        }
                        Select: UnionToIntersection<
                            SelectFromEntries<EntryType, C>
                        >
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
