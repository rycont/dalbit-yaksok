import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    signal: abortController.signal,
})

session.addModule(
    'main',
    `객체 = {
    이름: '홍길동'
    나이: 30
    주소: '서울시 강남구',
}

"자기소개 해보겠습니다" 보여주기

객체 의 키 마다 반복하기
    키 + ": " + 객체[키] 보여주기
`,
    {
        // executionDelay: 500,
    },
)

const startTime = Date.now()

const result = await session.runModule('main')

const endTime = Date.now()
const duration = endTime - startTime
console.log(`Execution finished in ${duration} ms`)
