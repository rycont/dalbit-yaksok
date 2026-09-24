import { assertIsError } from '@std/assert'
import { FunctionMustHaveOneOrMoreStringPartError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('고정된 부분이 없는 함수', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
약속, (A) (B) (C)
    A + B + C 반환하기

(10) (20) (30) 보여주기
            `,
    )
    assertIsError(
        codeFile.prepareErrors[0],
        FunctionMustHaveOneOrMoreStringPartError,
    )
})
