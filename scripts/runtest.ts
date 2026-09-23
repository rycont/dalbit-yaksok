import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.useBaseScope(
    await session
        .addModule(
            'base',
            `과일 = ["사과", "바나나", "딸기", "사과", "딸기", "사과"]`,
        )
        .run(),
)

await session
    .addModule(
        '처리기',
        `약속, (데이터)로 처리하기
    데이터 보여주기`,
    )
    .run()

await session.addModule('main', `@처리기 과일로 처리하기`).run()
