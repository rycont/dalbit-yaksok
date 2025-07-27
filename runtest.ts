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

객체['자식새끼'] += '숫자 인덱스'
객체 보여주기
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
