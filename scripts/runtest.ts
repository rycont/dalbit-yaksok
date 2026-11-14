import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

const codeFile = session.addModule(
    'main',
    `객체 = {
    이름: '홍길동'
    나이: 30
    주소: '서울시 강남구',
}

객체['나이'] += 1
객체['나이'] 보여주기

객체['주소'] -= 2
객체 보여주기`,
)

await codeFile.run()
