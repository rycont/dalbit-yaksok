import { assert, assertEquals, assertIsError } from 'assert'

import { CallStackDepthExceededError } from '../../core/error/index.ts'
import { yaksok } from '../../core/mod.ts'

const recursiveProgram = (invokeDepth: number) => `
약속, 재귀 (단계)
    만약 단계 <= 1 이면
        약속 그만
    재귀 (단계 - 1)

재귀 ${invokeDepth}
`

Deno.test('call stack depth limit allows 32 levels of recursion', async () => {
    const result = await yaksok(recursiveProgram(32))

    assertEquals(result.reason, 'finish')
})

Deno.test('call stack depth limit throws when exceeding 32 levels of recursion', async () => {
    const result = await yaksok(recursiveProgram(33))

    assert(result.reason === 'error', `Expected error, but got ${result.reason}`)
    assertIsError(result.error, CallStackDepthExceededError)
})
