import { test, expect } from 'vite-plus/test'
import {
    BooleanValue,
    dalbitToJS,
    IndexedValue,
    ListValue,
    NumberValue,
    ReferenceStore,
    StringValue,
    ValueType,
} from '@dalbit-yaksok/core'

test('StringValue', () => {
    const dalbitValue = new StringValue('hello')
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe('hello')
})

test('NumberValue', () => {
    const dalbitValue = new NumberValue(123)
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe(123)
})

test('BooleanValue', () => {
    const dalbitValue = new BooleanValue(true)
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe(true)
})

test('ListValue', () => {
    const dalbitValue = new ListValue([
        new StringValue('a'),
        new NumberValue(1),
        new BooleanValue(false),
    ])
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toStrictEqual(['a', 1, false])
})

test('IndexedValue', () => {
    const dalbitValue = new IndexedValue(
        new Map<string, ValueType>([
            ['a', new StringValue('b')],
            ['c', new NumberValue(1)],
        ]),
    )
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toStrictEqual({ a: 'b', c: 1 })
})

test('NestedValue', () => {
    const dalbitValue = new IndexedValue(
        new Map<string, ValueType>([
            [
                'a',
                new ListValue([
                    new StringValue('b'),
                    new IndexedValue(
                        new Map<string, ValueType>([['c', new NumberValue(1)]]),
                    ),
                ]),
            ],
        ]),
    )
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toStrictEqual({ a: ['b', { c: 1 }] })
})

test('ReferenceStore', () => {
    const originalObject = { key: 'value', number: 42 }
    const dalbitValue = new ReferenceStore(originalObject)
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe(originalObject)
})

test('ReferenceStore with primitive', () => {
    const originalString = 'test string'
    const dalbitValue = new ReferenceStore(originalString)
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe(originalString)
})

test('ReferenceStore with number', () => {
    const originalNumber = 123
    const dalbitValue = new ReferenceStore(originalNumber)
    const jsValue = dalbitToJS(dalbitValue)
    expect(jsValue).toBe(originalNumber)
})
