import { assertEquals } from '@std/assert'
import { Token, TOKEN_TYPE, Identifier } from '@dalbit-yaksok/core'
import {
    NotExecutableNodeError,
    UnknownNodeError,
    IncompleteMentionError,
} from '../core/error/unknown-node.ts'

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

Deno.test('NotExecutableNodeError with message', () => {
    const tokens: Token[] = [
        {
            type: TOKEN_TYPE.IDENTIFIER,
            value: 'test',
            position: { line: 1, column: 1 },
        },
    ]

    const node = new Identifier('test', tokens)
    const error = new NotExecutableNodeError({
        tokens,
        resource: {
            node,
            message: 'Custom error message',
        },
    })

    assertEquals(error.message, 'Custom error message')
})

Deno.test('NotExecutableNodeError without message', () => {
    const tokens: Token[] = [
        {
            type: TOKEN_TYPE.IDENTIFIER,
            value: 'test',
            position: { line: 1, column: 1 },
        },
    ]

    const node = new Identifier('test', tokens)
    const error = new NotExecutableNodeError({
        tokens,
        resource: {
            node,
        },
    })

    assertEquals(error.message.includes('test'), true)
    assertEquals(error.message.includes('실행할 수 없는 코드예요'), true)
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

    const node = new Identifier('module', tokens)
    const error = new IncompleteMentionError({
        tokens,
        resource: {
            node,
        },
    })

    assertEquals(error.message.includes('@module'), true)
    assertEquals(error.message.includes('실행할 수 없어요'), true)
})
