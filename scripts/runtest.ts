import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'device',
        `
이벤트(BUTTON_PRESSED), 버튼 눌렀을 때
`,
    )
    .run()
const codeFile = session.addModule(
    'main',
    `
상태 = "정지 중"

@device 버튼 눌렀을 때
    만약 상태 == "정지 중" 이면
        "출발" 보여주기
        상태 = "가는 중"
    아니면
        "정지" 보여주기
        상태 = "정지 중"
`,
)

session.eventCreation.sub('BUTTON_PRESSED', async (_, callback, terminate) => {
    await callback()
    await callback()
    terminate()
})

await codeFile.run()
