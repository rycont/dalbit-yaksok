import { YaksokSession } from '@dalbit-yaksok/core'

const code = {
    main: `
@코레일 지금 (["집", "회사"])에 가기
        `,
    코레일: `
약속, 지금 (도착지들)에 가기
    도착지들[0] + "에 왔습니다" 보여주기`,
}

const session = new YaksokSession({
    executionDelay: 100,
})

session.addModules(code)
await session.runModule('main')
