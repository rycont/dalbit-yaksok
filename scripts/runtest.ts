import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 배열 개수 <= 5 이면
    "실행" 보여주기
`,
)

await codeFile.run()
