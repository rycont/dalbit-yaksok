import { YaksokSession } from '@dalbit-yaksok/core'
// import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
// await session.extend(new QuickJS())

session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
    callback()
    await new Promise<void>((ok) => setTimeout(ok, 1000))
    callback()
    await new Promise<void>((ok) => setTimeout(ok, 1000))
    callback()
    await new Promise<void>((ok) => setTimeout(ok, 1000))

    terminate()
})

await session
    .addModule(
        'main',
        `이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이벤트 실행됨" 보여주기`,
    )
    .run()
