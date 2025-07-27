import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    signal: abortController.signal,
})

session.addModule(
    'main',
    `이력서 = {
    출신: "미시시피"
    부모님: "완전 부자",
    자격증: {
        컴활: "2급"
        JLPT: "N1"
    }
}\n
"자기소개 해보겠습니다"
이력서 의 항목 마다 반복하기
    항목 + "?" 보여주기
    이력서[항목] 보여주기
    "" 보여주기
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
