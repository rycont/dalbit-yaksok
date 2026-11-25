import { YaksokSession, IndexedValue, NumberValue } from '@dalbit-yaksok/core'
import { test, expect, assert } from 'vite-plus/test'

test('Dictionary literal accepts numeric keys', async () => {
    const session = new YaksokSession()
    const frame = await session
        .addModule(
            'main',
            `소인수 = {
    2: 0,
    3: 0,
    5: 0,
    7: 0
}

소인수 보여주기`,
        )
        .run()
    const value = frame.get(frame.scope.findSlot('소인수')[0]!)
    assert(value instanceof IndexedValue)

    for (const key of [2, 3, 5, 7]) {
        const storedValue = value.getItem(key) as NumberValue
        expect(storedValue.value).toBe(0)
    }
})
