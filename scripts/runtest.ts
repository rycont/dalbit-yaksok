import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

// Base context with a list variable
session.useBaseScope(
    await session
        .addModule(
            'base',
            `과일 = ["사과", "바나나", "딸기", "사과", "딸기", "사과"]`,
        )
        .run(),
)

// Module with a function that uses postposition '로'
session.addModule(
    '처리기',
    `약속, (데이터)로 처리하기
    데이터 보여주기`,
)

// Main module uses @mention with base context variable + postposition
const codeFile = session.addModule('main', `@처리기 과일로 처리하기`)

await codeFile.run()
