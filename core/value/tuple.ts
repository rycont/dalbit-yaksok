import {
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListIndexTypeError,
} from '../error/indexed.ts'
import { TupleNotMutableError } from '../error/indexed.ts'
import { ValueType } from './base.ts'
import { IndexedValue } from './indexed.ts'
import { ListValue } from './list.ts'
import { NumberValue } from './primitive.ts'

export class TupleValue extends IndexedValue {
    static override friendlyName = '튜플'
    override entries: Map<number, ValueType> = new Map()

    constructor(entries: ValueType[]) {
        const entriesMap = new Map(
            entries.map((entry, index) => [index, entry]),
        )

        super(entriesMap)
        this.entries = entriesMap
    }

    override getItem(index: number): ValueType {
        TupleValue.assertProperIndex(index)

        return super.getItem(index)
    }

    override setItem(_index: number, _value: ValueType): void {
        throw new TupleNotMutableError({
            resource: {},
        })
    }

    static assertProperIndex(index: number): void {
        if (!Number.isSafeInteger(index)) {
            throw new ListIndexTypeError({
                resource: {
                    index,
                },
            })
        }

        const isProperIndex = index >= 0

        if (isProperIndex) {
            return
        }

        throw new ListIndexMustBeGreaterOrEqualThan0Error({
            resource: {
                index,
            },
        })
    }

    override toPrint(): string {
        const keys = this.entries.keys().toArray()

        if (keys.length === 0) {
            return '(빈 튜플)'
        }

        const maxKey = Math.max(...keys)

        const values: (ValueType | null)[] = []

        for (let i = 0; i <= maxKey; i++) {
            values[i] = this.entries.get(i) ?? null
        }

        const formatted = values
            .map((value) => (value ? value.toPrint() : '(값 없음)'))
            .join(', ')
        const trailingComma = keys.length === 1 ? ',' : ''

        return `(${formatted}${trailingComma})`
    }

    public override enumerate(): Iterable<ValueType> {
        return this.entries.values()
    }

    public override getItemsFromKeys(keysListValue: ListValue): TupleValue {
        const keys = [...keysListValue.entries.values()]
        const list: ValueType[] = []

        for (const keyValue of keys) {
            if (!(keyValue instanceof NumberValue)) {
                throw new ListIndexTypeError({
                    resource: {
                        index: keyValue.toPrint(),
                    },
                })
            }

            const key = keyValue.value

            const value = this.getItem(key)
            list.push(value)
        }

        return new TupleValue(list)
    }
}
