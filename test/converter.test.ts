import { assert, assertEquals, assertStrictEquals } from '@std/assert'
import {
    StringValue,
    NumberValue,
    BooleanValue,
    ListValue,
    IndexedValue,
    ValueType,
    ReferenceStore,
    dalbitToJS,
    jsToDalbit,
} from '@dalbit-yaksok/core'

Deno.test('dalbitToJS', async (t) => {
    await t.step('StringValue', () => {
        const dalbitValue = new StringValue('hello')
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, 'hello')
    })

    await t.step('NumberValue', () => {
        const dalbitValue = new NumberValue(123)
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, 123)
    })

    await t.step('BooleanValue', () => {
        const dalbitValue = new BooleanValue(true)
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, true)
    })

    await t.step('ListValue', () => {
        const dalbitValue = new ListValue([
            new StringValue('a'),
            new NumberValue(1),
            new BooleanValue(false),
        ])
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, ['a', 1, false])
    })

    await t.step('IndexedValue', () => {
        const dalbitValue = new IndexedValue(
            new Map<string, ValueType>([
                ['a', new StringValue('b')],
                ['c', new NumberValue(1)],
            ]),
        )
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, { a: 'b', c: 1 })
    })

    await t.step('NestedValue', () => {
        const dalbitValue = new IndexedValue(
            new Map<string, ValueType>([
                [
                    'a',
                    new ListValue([
                        new StringValue('b'),
                        new IndexedValue(
                            new Map<string, ValueType>([
                                ['c', new NumberValue(1)],
                            ]),
                        ),
                    ]),
                ],
            ]),
        )
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, { a: ['b', { c: 1 }] })
    })

    await t.step('ReferenceStore', () => {
        const originalObject = { key: 'value', number: 42 }
        const dalbitValue = new ReferenceStore(originalObject)
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, originalObject)
    })

    await t.step('ReferenceStore with primitive', () => {
        const originalString = 'test string'
        const dalbitValue = new ReferenceStore(originalString)
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, originalString)
    })

    await t.step('ReferenceStore with number', () => {
        const originalNumber = 123
        const dalbitValue = new ReferenceStore(originalNumber)
        const jsValue = dalbitToJS(dalbitValue)
        assertEquals(jsValue, originalNumber)
    })
})

Deno.test('jsToDalbit', async (t) => {
    await t.step('String', () => {
        const dalbitValue = jsToDalbit('hello')
        assert(dalbitValue instanceof StringValue)
        assertEquals(dalbitValue.value, 'hello')
    })

    await t.step('Number', () => {
        const dalbitValue = jsToDalbit(42)
        assert(dalbitValue instanceof NumberValue)
        assertEquals(dalbitValue.value, 42)
    })

    await t.step('Boolean', () => {
        const dalbitValue = jsToDalbit(true)
        assert(dalbitValue instanceof BooleanValue)
        assertEquals(dalbitValue.value, true)
    })

    await t.step('Array to ListValue', () => {
        const dalbitValue = jsToDalbit(['a', 1, false])
        assert(dalbitValue instanceof ListValue)
        assertEquals(
            [...dalbitValue.enumerate()].map((item) => item.toPrint()),
            ['a', '1', '거짓'],
        )
    })

    await t.step('Plain object to IndexedValue', () => {
        const dalbitValue = jsToDalbit({ a: 'b', count: 2 })
        assert(dalbitValue instanceof IndexedValue)
        const a = dalbitValue.getItem('a')
        const count = dalbitValue.getItem('count')
        assert(a instanceof StringValue)
        assertEquals(a.value, 'b')
        assert(count instanceof NumberValue)
        assertEquals(count.value, 2)
    })

    await t.step('Map with string and number keys', () => {
        const original = new Map<unknown, unknown>([
            ['name', 'Dalbit'],
            [1, true],
        ])
        const dalbitValue = jsToDalbit(original)
        assert(dalbitValue instanceof IndexedValue)
        const name = dalbitValue.getItem('name')
        const numberKey = dalbitValue.getItem(1)
        assert(name instanceof StringValue)
        assertEquals(name.value, 'Dalbit')
        assert(numberKey instanceof BooleanValue)
        assertEquals(numberKey.value, true)
    })

    await t.step('Pass through existing ValueType', () => {
        const original = new StringValue('keep')
        const converted = jsToDalbit(original)
        assertStrictEquals(converted, original)
    })

    await t.step('Fallback to ReferenceStore', () => {
        const symbol = Symbol('ref')
        const converted = jsToDalbit(symbol)
        assert(converted instanceof ReferenceStore)
        assertStrictEquals(converted.ref, symbol)
    })
})
