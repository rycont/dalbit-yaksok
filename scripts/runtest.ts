import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `횟수 = 0

20번 반복
	횟수 보여주기
    횟수 == 10 보여주기
	횟수 = 횟수 + 1

	만약 횟수 == 10 이면
		반복 그만
`,
)

await codeFile.run()
