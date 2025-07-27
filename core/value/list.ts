import { dim } from '../error/common.ts'
import {
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListIndexTypeError,
} from '../error/indexed.ts'
import { ValueType } from './base.ts'
import { IndexedValue } from './indexed.ts'
import { NumberValue } from './primitive.ts'

export class ListValue extends IndexedValue {
    static override friendlyName = '목록'
    override entries: Map<number, ValueType> = new Map()

    constructor(entries: ValueType[]) {
        const entriesMap = new Map(
            entries.map((entry, index) => [index, entry]),
        )

        super(entriesMap)
        this.entries = entriesMap
    }

    override getItem(index: number): ValueType {
        ListValue.assertProperIndex(index)

        return super.getItem(index)
    }

    override setItem(index: number, value: ValueType): void {
        ListValue.assertProperIndex(index)

        super.setItem(index, value)
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
            return `[ ${dim('빈 목록')} ]`
        }

        const maxKey = Math.max(...keys)

        let values: (ValueType | null)[] = []

        for (let i = 0; i <= maxKey; i++) {
            values[i] = this.entries.get(i) ?? null
        }

        return `[${values
            .map((value) => (value ? value.toPrint() : dim('(값 없음)')))
            .join(', ')}]`
    }

    public override enumerate(): Iterable<ValueType> {
        return this.entries.values()
    }

    public override getItemsFromKeys(keysListValue: ListValue): ListValue {
        const keys = [...keysListValue.entries.values()]
        const list = []

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

        return new ListValue(list)
    }
}
