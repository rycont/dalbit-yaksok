import { CodeFile, TOKEN_TYPE, tokenize } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert/equals'

Deno.test('Incompleted String', () => {
    const tokenized = tokenize(`내_이름 = "이름이 뭐에`)
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
            type: TOKEN_TYPE.SPACE,
            value: ' ',
            position: {
                line: 1,
                column: 5,
            },
        },
        {
            type: TOKEN_TYPE.ASSIGNER,
            value: '=',
            position: {
                line: 1,
                column: 6,
            },
        },
        {
            type: TOKEN_TYPE.SPACE,
            value: ' ',
            position: {
                line: 1,
                column: 7,
            },
        },
        {
            type: TOKEN_TYPE.STRING,
            value: '"이름이 뭐에',
            position: {
                line: 1,
                column: 8,
            },
        },
    ])
})

Deno.test('Unknown Character', () => {
    const tokenized = tokenize(`"이름이 뭐에"!$`)
    assertEquals(tokenized, [
        {
            type: 'STRING',
            value: '"이름이 뭐에"',
            position: { column: 1, line: 1 },
        },
        { type: 'UNKNOWN', position: { column: 9, line: 1 }, value: '!' },
        { type: 'UNKNOWN', position: { column: 10, line: 1 }, value: '$' },
    ])
})

Deno.test('Optimistic Colorizer', () => {
    const target = `"달빛약속에 오신걸 환영합니다" 보여주기
약속, 키가 (키)cm이고 몸무게가 (몸무게)일 때 비만도
    몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (170)cm이고 몸무게가 (70)일 때 비만도

비만도 보여주기`

    for (let i = 0; i < target.length; i++) {
        const code = target.slice(0, i)
        try {
            new CodeFile(code, Symbol('asdf')).parseOptimistically()
        } catch (e) {
            console.error(e)
        }
    }
})
