import { assert, assertInstanceOf } from 'assert'
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

    const result = await session.runModule('main')

    assert(result.reason === 'error')
    assertInstanceOf(result.error, IndexKeyNotFoundError)
})
