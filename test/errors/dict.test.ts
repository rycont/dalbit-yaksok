import { assert, assertInstanceOf } from '@std/assert'
import { InvalidTypeForOperatorError } from '../../core/error/calculation.ts'
import { IndexKeyNotFoundError, YaksokSession } from '../../core/mod.ts'

Deno.test('Key is not found in dictionary', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `객체 = {
    이름: '홍길동'
    나이: 30
    주소: '서울시 강남구',
    자격증: {
        한식: "3급",
        일식: "4급"
    },
    자식새끼: [{
        이름: "또치",
        나이: 3
    }, {
        이름: '둘리',
        나이: 0
    }]
}

객체['자격증']['자식새끼'][1] 보여주기`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'error')
    assertInstanceOf(result.error, IndexKeyNotFoundError)
})

Deno.test('Dict Compound Assignment Operation Error', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `객체 = {
    이름: '홍길동'
    나이: 30
    주소: '서울시 강남구',
}

객체['나이'] += 1
객체['나이'] 보여주기

객체['주소'] -= 2`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'error')
    assertInstanceOf(result.error, InvalidTypeForOperatorError)
})
