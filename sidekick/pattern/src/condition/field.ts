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
        unknown,
        ChainShapeBase<{
                  [
                      K2 in keyof Partial<ChainShape<C>['Input'][K]>
                  ]: ChainShape<C>['Input'][K][K2]
              }
        >
    >
}

// type NewShapeFromEntries<R, Input, EntryType> = ChainShapeBase<
//     {
//         [
//             K in keyof EntryType as unknown extends EntryType[K] ? never : K
//         ]: ChainShape<EntryType[K]>['Input']
//     },
//     UnionToIntersection<SelectFromEntries<EntryType, Input>>,
//     unknown,
//     R
// >

export class FieldCondition extends MatchCondition {
    public static methodName = 'field' as const

    constructor(
        private entries: Record<string, Chain<unknown, ChainShapeBase<unknown>>>,
    ) {
        super()
    }

    static creater<
        const C extends Chain<unknown, ChainShapeBase<unknown, unknown, unknown, unknown>>,
    >(chain: C) {
        return <const RT, EntryType extends EntriesFromChain<C>>(entries: EntryType) => {
            return chain.pipe<RT, {
                Input: unknown,
                Meta: unknown,
                Select: unknown,
                ParentInput: RT
            }
                // NewShapeFromEntries<R, ChainShape<C>['Input'], EntryType>
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
