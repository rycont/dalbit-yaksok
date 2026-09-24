import { assert, assertIsError } from '@std/assert'
import { IndentIsNotMultipleOf4Error } from '../../core/error/index.ts'
import { IndentLevelMismatchError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('온전하지 않은 인덴트', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
    이름 = '홍길동'
     나이 = 20
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], IndentLevelMismatchError)
})

Deno.test('길이가 잘못된 인덴트', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
이름 = '홍길동'
     나이 = 20
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], IndentIsNotMultipleOf4Error)
})

Deno.test('시작부터 들어간 인덴트', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
    이름 = '홍길동'
     나이 = 20
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], IndentLevelMismatchError)
})

Deno.test('레벨을 초월한 인덴트', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
이름 = '홍길동'
        나이 = 20
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], IndentLevelMismatchError)
})
