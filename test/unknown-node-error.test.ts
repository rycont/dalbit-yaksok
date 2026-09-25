import { assertEquals } from '@std/assert'
import { Identifier, Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import {
    IncompleteMentionError,
    NotExecutableNodeError,
    UnknownNodeError,
} from '../core/error/unknown-node.ts'
import { Mention } from '../core/node/mention.ts'

Deno.test('UnknownNodeError', () => {
    const tokens: Token[] = [
        {
            type: TOKEN_TYPE.IDENTIFIER,
            value: 'invalid',
            position: { line: 1, column: 1 },
        },
    ]

    const error = new UnknownNodeError({ tokens })
    assertEquals(
        error.message,
        '올바르지 않은 코드에요. 문법을 다시 확인해주세요.',
    )
})

Deno.test('IncompleteMentionError', () => {
    const tokens: Token[] = [
        {
            type: TOKEN_TYPE.MENTION,
            value: '@',
            position: { line: 1, column: 1 },
        },
        {
            type: TOKEN_TYPE.IDENTIFIER,
            value: 'module',
            position: { line: 1, column: 2 },
        },
    ]

    const node = new Mention('module', tokens)
    const error = new IncompleteMentionError({
        tokens,
        resource: {
            node,
        },
    })

    assertEquals(error.message.includes('@module'), true)
    assertEquals(error.message.includes('실행할 수 없어요'), true)
})
