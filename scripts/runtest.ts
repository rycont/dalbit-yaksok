import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        '장치',
        `약속, 이동하기(가로, 세로)
    "{가로},{세로}" 보여주기

약속, 설정하기(밝기, 소리?)
    소리 보여주기
`,
    )
    .run()

const codeFile = session.addModule(
    'main',
    `약속, 키가 (키)cm이고 몸무게가 (몸무게)kg일 때 비만도
    몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (177)cm이고 몸무게가 (68)kg일 때 비만도
비만도 보여주기

`,
)

await codeFile.run()
