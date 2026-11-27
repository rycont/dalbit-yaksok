import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

const codeFile = session.addModule(
    'main',
    `약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 배열 개수 <= 1 이면
    "실행" 보여주기`,
)
await codeFile.run()
