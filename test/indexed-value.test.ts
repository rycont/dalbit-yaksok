import { assertEquals } from '@std/assert'
import {
    IndexedValue,
    ListValue,
    NumberValue,
    StringValue,
    ValueType,
} from '@dalbit-yaksok/core'
import { ListIndexTypeError } from '@dalbit-yaksok/core'

Deno.test('IndexedValue getItemsFromKeys', () => {
    const indexed = new IndexedValue(
        new Map<string | number, ValueType>([
            ['a', new StringValue('apple')],
            ['b', new StringValue('banana')],
            [1, new NumberValue(100)],
            [2, new NumberValue(200)],
        ]),
    )

    const keys = new ListValue([
        new StringValue('a'),
        new NumberValue(2),
    ])

    const result = indexed.getItemsFromKeys(keys)
    const entries = [...result.getEntries()]

    assertEquals(entries.length, 2)
    assertEquals(entries[0][0], 'a')
    assertEquals(entries[0][1].toPrint(), 'apple')
    assertEquals(entries[1][0], 2)
    assertEquals(entries[1][1].toPrint(), '200')
})

Deno.test('IndexedValue getItemsFromKeys with invalid key type', () => {
    const indexed = new IndexedValue(
        new Map<string, ValueType>([
            ['a', new StringValue('apple')],
        ]),
    )

    const keys = new ListValue([
        new StringValue('a'),
        new ListValue([new StringValue('invalid')]), // Invalid key type
    ])

    try {
        indexed.getItemsFromKeys(keys)
        throw new Error('Should have thrown ListIndexTypeError')
    } catch (e) {
        assertEquals(e instanceof ListIndexTypeError, true)
    }
})

Deno.test('IndexedValue enumerate', () => {
    const indexed = new IndexedValue(
        new Map<string | number, ValueType>([
            ['a', new StringValue('apple')],
            ['b', new StringValue('banana')],
            [1, new NumberValue(100)],
        ]),
    )

    const enumerated = [...indexed.enumerate()]
    assertEquals(enumerated.length, 3)

    // Check that we get StringValue and NumberValue instances
    const stringValues = enumerated.filter((v) => v instanceof StringValue)
    const numberValues = enumerated.filter((v) => v instanceof NumberValue)
    assertEquals(stringValues.length >= 2, true) // 'a' and 'b'
    assertEquals(numberValues.length >= 1, true) // 1
})

Deno.test('IndexedValue enumerate with empty dict', () => {
    const indexed = new IndexedValue(new Map())
    const enumerated = [...indexed.enumerate()]
    assertEquals(enumerated.length, 0)
})

