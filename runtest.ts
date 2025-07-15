import { YaksokSession } from '@dalbit-yaksok/core'

const code = {
    main: `
자리표 = [
    ["X", "O", "O", "O"],
    ["O", "X", "O", "O"],
    ["O", "O", "X", "O"],
    ["O", "O", "O", "X"]
]

반복 자리표 의 줄 마다
    줄 보여주기

@코레일 계산
@코레일 단가 보여주기
        `,
    코레일: `
약속, 계산
    "고생하셨습니다" 보여주기

단가 = 10000
`,
}

const session = new YaksokSession()

session.addModules(code)
await session.runModule('main')
