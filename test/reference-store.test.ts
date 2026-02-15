import { assertEquals } from '@std/assert'
import { ReferenceStore } from '@dalbit-yaksok/core'

Deno.test('ReferenceStore toPrint with object that has toString', () => {
    const obj = {
        toString() {
            return 'custom string'
        },
    }
    const ref = new ReferenceStore(obj)
    assertEquals(ref.toPrint(), 'custom string')
})

Deno.test('ReferenceStore toPrint with object that throws in toString', () => {
    const obj = {
        toString() {
            throw new Error('toString error')
        },
    }
    const ref = new ReferenceStore(obj)
    // Should fallback to String(obj) which works for plain objects
    const result = ref.toPrint()
    // Can be either '[object Object]' or '[참조값]' depending on String() behavior
    assertEquals(typeof result === 'string', true)
})

Deno.test(
    'ReferenceStore toPrint with object that cannot be converted to string',
    () => {
        // Create an object that throws when converted to string
        // We need to override valueOf and toString to make String() throw
        const obj: any = {}
        let callCount = 0
        Object.defineProperty(obj, 'toString', {
            value: () => {
                callCount++
                if (callCount === 1) {
                    throw new Error('toString error')
                }
                throw new Error('Cannot convert')
            },
            configurable: true,
        })
        Object.defineProperty(obj, 'valueOf', {
            value: () => {
                throw new Error('valueOf error')
            },
            configurable: true,
        })
        const ref = new ReferenceStore(obj)
        // First toString() call throws, then String() also throws, should return fallback
        const result = ref.toPrint()
        assertEquals(result, '[참조값]')
    },
)

Deno.test('ReferenceStore toPrint with null', () => {
    const ref = new ReferenceStore(null)
    assertEquals(ref.toPrint(), 'null')
})

Deno.test('ReferenceStore toPrint with undefined', () => {
    const ref = new ReferenceStore(undefined)
    assertEquals(ref.toPrint(), 'undefined')
})

Deno.test('ReferenceStore toPrint with number', () => {
    const ref = new ReferenceStore(42)
    assertEquals(ref.toPrint(), '42')
})

Deno.test('ReferenceStore toPrint with boolean', () => {
    const ref = new ReferenceStore(true)
    assertEquals(ref.toPrint(), 'true')
})
