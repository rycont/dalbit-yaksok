import { dalbitToJS } from './converter.ts'
import {
    BooleanValue,
    IndexedValue,
    ListValue,
    NumberValue,
    StringValue,
    ValueType,
} from '../mod.ts'
import { assertEquals } from '@std/assert'

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
})
