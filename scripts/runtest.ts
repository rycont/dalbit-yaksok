import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
    console.log('1')
    await callback()
    console.log('2')
    await callback()
    console.log('3')
    terminate()
})

await session
    .addModule(
        'main',
        `이벤트(TEST_EVENT), 테스트 이벤트

상태 = "정지 중"

테스트 이벤트
    상태 보여주기
    상태 = "가는 중"
    상태 보여주기`,
    )
    .run()
