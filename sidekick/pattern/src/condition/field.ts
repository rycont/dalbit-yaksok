import {
    ChainShape,
    ChainShapeBase,
    KeyPlaceholder,
    PlaceholderTraits,
    Prettify,
    signals,
    TypePlaceholder,
    UnionToIntersection,
    UnpackTypePlaceholder,
    UpdateShape,
} from '../common.ts'
import { GlobalRequester, MatchCondition } from './base.ts'
import type { Chain } from './index.ts'

type MergeValues<T> = UnionToIntersection<T[keyof T]>

type SelectFromEntries<EntryType, OriginChain> = Prettify<
    MergeValues<{
        [
            K in keyof EntryType & keyof ChainShape<OriginChain>['Input'] as [
                unknown,
            ] extends ChainShape<EntryType[K]>['Select']
                ? never
                : K
        ]: {
            [
                K2 in keyof ChainShape<
                    EntryType[K]
                >['Select'] as K2 extends KeyPlaceholder ? K : K2
            ]: ChainShape<EntryType[K]>['Select'][K2] extends TypePlaceholder
                ? UnpackTypePlaceholder<
                      ChainShape<OriginChain>['Input'][K],
                      PlaceholderTraits<ChainShape<EntryType[K]>['Select'][K2]>
                  >
                : ChainShape<EntryType[K]>['Select'][K2]
        }
    }>
>

type EntriesFromChain<C> = {
    [K in keyof Partial<ChainShape<C>['Input']>]: Chain<
        ChainShapeBase<ChainShape<C>['Input'][K] | TypePlaceholder>
    >
}

type NewShapeFromEntries<C extends Chain, EntryType> = UpdateShape<
    ChainShape<C>,
    {
        Input: ChainShape<C>['Input'] & {
            [
                K in keyof EntryType as undefined extends EntryType[K]
                    ? never
                    : K
            ]: ChainShape<EntryType[K]>['Input']
        }
        Select: UnionToIntersection<SelectFromEntries<EntryType, C>>
    }
>

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(private entries: Record<string, Chain>) {
        super()
    }

    static creater<C extends Chain>(
        chain: C,
    ): <EntryType extends EntriesFromChain<C>>(
        entries: EntryType,
    ) => Chain<NewShapeFromEntries<C, EntryType>> {
        return <EntryType extends EntriesFromChain<C>>(entries: EntryType) => {
            return chain.pipe<NewShapeFromEntries<C, EntryType>>(
                new FieldCondition(entries),
            )
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
