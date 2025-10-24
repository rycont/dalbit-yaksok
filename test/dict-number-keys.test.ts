import { assert, assertEquals } from 'assert'
import { YaksokSession } from '../core/mod.ts'
import { IndexedValue } from '../core/value/indexed.ts'
import { NumberValue } from '../core/value/primitive.ts'

Deno.test('Dictionary literal accepts numeric keys', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `소인수 = {
    2: 0,
    3: 0,
    5: 0,
    7: 0
}

소인수 보여주기`,
    )

    const result = await session.runModule('main')
    assertEquals(result.reason, 'finish')

    const scope = session.entrypoint?.ranScope
    const value = scope?.getVariable('소인수')
    assert(value instanceof IndexedValue)

    for (const key of [2, 3, 5, 7]) {
        const storedValue = value.getItem(key) as NumberValue
        assertEquals(storedValue.value, 0)
    }
})
