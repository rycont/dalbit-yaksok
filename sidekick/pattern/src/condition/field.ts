import {
    ChainShape,
    ChainShapeBase,
    Fallback,
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

type SelectFromEntries<EntryType, OriginInput> = Prettify<
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
                ? UnpackTypePlaceholder<
                      OriginInput extends { [key in K]: unknown }
                          ? OriginInput[K]
                          : never,
                      PlaceholderTraits<ChainShape<EntryType[K]>['Select'][K2]>
                  >
                : ChainShape<EntryType[K]>['Select'][K2]
        }
    }>
>

type EntriesFromChain<C> = {
    [K in keyof Partial<ChainShape<C>['Input']>]: Chain<
        ChainShapeBase<
            | {
                  [
                      K2 in keyof Partial<ChainShape<C>['Input'][K]>
                  ]: ChainShape<C>['Input'][K][K2]
              }
            | TypePlaceholder
        >
    >
}

type NewShapeFromEntries<ParentInput, EntryType> = UpdateShape<
    ChainShapeBase<ParentInput>,
    {
        Input: ParentInput & {
            [
                K in keyof EntryType as unknown extends EntryType[K] ? never : K
            ]: Fallback<
                ChainShape<EntryType[K]>['Input'],
                ParentInput extends { [key in K]: unknown }
                    ? ParentInput[K]
                    : unknown
            >
        }
        Select: UnionToIntersection<SelectFromEntries<EntryType, ParentInput>>
        ParentInput: ParentInput
    }
>

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(private entries: Record<string, Chain>) {
        super()
    }

    static creater<C extends Chain>(chain: C) {
        return <ParentInput, EntryType extends EntriesFromChain<C>>(
            entries: EntryType,
        ) => {
            return chain.pipe<NewShapeFromEntries<ParentInput, EntryType>>(
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
