import { assertIsError } from '@std/assert'
import { UnexpectedTokenError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('인자를 닫는 괄호가 제 위치에 없습니다', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
약속, (음식 10)을 맛있게 만들기
    음식 + "을/를 맛있게 만들었습니다." 보여주기
`,
    )
    assertIsError(codeFile.prepareErrors[0], UnexpectedTokenError)
})
