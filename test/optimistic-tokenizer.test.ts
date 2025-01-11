import { TOKEN_TYPE, tokenize } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert/equals'

Deno.test('Incompleted String', () => {
    const tokenized = tokenize(`내_이름: "이름이 뭐에`)
    assertEquals(tokenized, [
        {
            type: TOKEN_TYPE.IDENTIFIER,
            value: '내_이름',
            position: {
                line: 1,
                column: 1,
            },
        },
        {
            type: TOKEN_TYPE.COLON,
            value: ':',
            position: {
                line: 1,
                column: 5,
            },
        },
        {
            type: TOKEN_TYPE.SPACE,
            value: ' ',
            position: {
                line: 1,
                column: 6,
            },
        },
        {
            type: TOKEN_TYPE.STRING,
            value: '"이름이 뭐에',
            position: {
                line: 1,
                column: 7,
            },
        },
    ])
})
