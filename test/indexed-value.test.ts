import { test, expect } from 'vite-plus/test'
import {
    IndexedValue,
    ListValue,
    NumberValue,
    StringValue,
    ValueType,
} from '@dalbit-yaksok/core'
import { ListIndexTypeError } from '@dalbit-yaksok/core'

test('IndexedValue getItemsFromKeys', () => {
    const indexed = new IndexedValue(
        new Map<string | number, ValueType>([
            ['a', new StringValue('apple')],
            ['b', new StringValue('banana')],
            [1, new NumberValue(100)],
            [2, new NumberValue(200)],
        ]),
    )

    const keys = new ListValue([new StringValue('a'), new NumberValue(2)])

    const result = indexed.getItemsFromKeys(keys)
    const entries = [...result.getEntries()]

    expect(entries.length).toBe(2)
    expect(entries[0][0]).toBe('a')
    expect(entries[0][1].toPrint()).toBe('apple')
    expect(entries[1][0]).toBe(2)
    expect(entries[1][1].toPrint()).toBe('200')
})

test('IndexedValue getItemsFromKeys with invalid key type', () => {
    const indexed = new IndexedValue(
        new Map<string, ValueType>([['a', new StringValue('apple')]]),
    )

    const keys = new ListValue([
        new StringValue('a'),
        new ListValue([new StringValue('invalid')]), // Invalid key type
    ])

    try {
        indexed.getItemsFromKeys(keys)
        throw new Error('Should have thrown ListIndexTypeError')
    } catch (e) {
        expect(e instanceof ListIndexTypeError).toBe(true)
    }
})

test('IndexedValue enumerate', () => {
    const indexed = new IndexedValue(
        new Map<string | number, ValueType>([
            ['a', new StringValue('apple')],
            ['b', new StringValue('banana')],
            [1, new NumberValue(100)],
        ]),
    )

    const enumerated = [...indexed.enumerate()]
    expect(enumerated.length).toBe(3)

    // Check that we get StringValue and NumberValue instances
    const stringValues = enumerated.filter((v) => v instanceof StringValue)
    const numberValues = enumerated.filter((v) => v instanceof NumberValue)
    expect(stringValues.length >= 2).toBe(true) // 'a' and 'b'
    expect(numberValues.length >= 1).toBe(true) // 1
})

test('IndexedValue enumerate with empty dict', () => {
    const indexed = new IndexedValue(new Map())
    const enumerated = [...indexed.enumerate()]
    expect(enumerated.length).toBe(0)
})
