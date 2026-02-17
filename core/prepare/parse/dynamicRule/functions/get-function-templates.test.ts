import { assertEquals, assertThrows } from '@std/assert'

import { convertTokensToFunctionTemplate } from './get-function-templates.ts'

import { tokenize } from '../../../tokenize/index.ts'
import { getFunctionDeclareRanges } from '../../../../util/get-function-declare-ranges.ts'

function getHeaderTemplate(code: string) {
    const tokens = tokenize(code)
    const range = getFunctionDeclareRanges(tokens).yaksok[0]
    const headerTokens = tokens.slice(range[0], range[1])

    return convertTokensToFunctionTemplate(headerTokens)
}

Deno.test('adds verb-form variant only to the last static word', () => {
    const template = getHeaderTemplate(
        `약속, (A)와/과 (B) 더하기\n    A + B 반환하기\n`,
    )

    const lastPiece = template.pieces.at(-1)
    if (!lastPiece) {
        throw new Error('template must have at least one piece')
    }

    assertEquals(lastPiece.type, 'static')
    assertEquals(lastPiece.value, ['더하기', '더하고'])

    const firstPieces = template.pieces
        .filter((piece) => piece.type === 'static')
        .slice(0, -1)

    assertEquals(firstPieces.length, 1)
    assertEquals(firstPieces[0].value.sort(), ['과', '와', '와/과'].sort())
})

Deno.test(
    'skips verb-form variant when function header does not end with a static word',
    () => {
        const template = getHeaderTemplate(
            `약속, (A)와/과 (B) 더하기 (C)\n    A + B + C 반환하기\n`,
        )

        const lastStaticPiece = template.pieces
            .filter((piece) => piece.type === 'static')
            .at(-1)

        if (!lastStaticPiece) {
            throw new Error('template must have at least one static piece')
        }

        assertEquals(lastStaticPiece.value, ['더하기'])
    },
)

Deno.test(
    'adds verb-form variants for each slash-separated option in the final word',
    () => {
        const template = getHeaderTemplate(
            `약속, 지금/현재/지금의 밀리초 가져오기/말하기\n    "" 반환하기\n`,
        )

        const lastPiece = template.pieces.at(-1)
        if (!lastPiece) {
            throw new Error('template must have at least one piece')
        }

        assertEquals(lastPiece.type, 'static')
        const expected = [
            '가져오기',
            '가져오고',
            '말하기',
            '말하고',
            '가져오기/말하기',
            '가져오고/말하고',
        ]

        assertEquals(lastPiece.value.length, expected.length)
        for (const e of expected) {
            // @ts-ignore
            if (lastPiece.value.includes(e)) continue
            throw new Error(`Missing ${e} in ${lastPiece.value}`)
        }
    },
)

Deno.test(
    'allows reserved words in static function-header text outside parameters',
    () => {
        const template = getHeaderTemplate(
            `약속, (중첩목록)에서 상위 고고 이고 거나 잠깐 (K)개 빈도 찾기\n    [] 반환하기\n`,
        )

        assertEquals(
            template.name,
            '(중첩목록)에서 상위 고고 이고 거나 잠깐 (K)개 빈도 찾기',
        )
    },
)

Deno.test('still rejects reserved words as function parameter names', () => {
    assertThrows(() =>
        getHeaderTemplate(`약속, (상위) 값 가져오기\n    상위 반환하기\n`),
    )
})

Deno.test(
    'still rejects reserved words in static header text when not allowlisted',
    () => {
        assertThrows(() =>
            getHeaderTemplate(`약속, (내용) 보여주기\n    내용 반환하기\n`),
        )
    },
)
