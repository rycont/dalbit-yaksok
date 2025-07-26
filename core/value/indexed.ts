import { IndexOutOfRangeError, ListIndexTypeError } from '../error/indexed.ts'
import { ObjectValue, ValueType } from './base.ts'
import { NumberValue, StringValue } from './primitive.ts'

import type { ListValue } from './list.ts'

export type IndexKeyType = string | number

export class IndexedValue extends ObjectValue {
    static override friendlyName = '사전'

    constructor(protected entries: Map<string | number, ValueType>) {
        super()
    }

    getItem(index: string | number): ValueType {
        if (!this.entries.has(index)) {
            throw new IndexOutOfRangeError({
                resource: {
                    target: (this.constructor as typeof IndexedValue)
                        .friendlyName,
                    index: index.toString(),
                },
            })
        }

        return this.entries.get(index)!
    }

    setItem(index: string | number, value: ValueType): void {
        this.entries.set(index, value)
    }

    getItemsFromKeys(keysListValue: ListValue): IndexedValue {
        const keys = [...keysListValue.entries.values()]
        const entries = new Map<IndexKeyType, ValueType>()

        for (const keyValue of keys) {
            if (
                !(
                    keyValue instanceof StringValue ||
                    keyValue instanceof NumberValue
                )
            ) {
                throw new ListIndexTypeError({
                    resource: {
                        index: keyValue.toPrint(),
                    },
                })
            }

            const key = keyValue.value

            const value = this.getItem(key)
            entries.set(key, value)
        }

        return new IndexedValue(entries)
    }

    override toPrint(): string {
        return `{\n\t${[...this.entries.entries()]
            .map(([key, value]) => `${key}: ${value.toPrint()}`)
            .join(',\n\t')}
}`
    }
}
