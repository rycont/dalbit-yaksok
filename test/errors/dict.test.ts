import {
    YaksokSession,
    IndexKeyNotFoundError,
    InvalidTypeForOperatorError,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Key is not found in dictionary', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
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
    await codeFile.run()
    expect.assert.instanceOf(errors[0], IndexKeyNotFoundError)
})

test('Dict Compound Assignment Operation Error', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
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
    await codeFile.run()
    expect.assert.instanceOf(errors[0], InvalidTypeForOperatorError)
})
