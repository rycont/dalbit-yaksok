import { assertEquals } from 'assert'
import { Expression, Keyword } from '../node/base.ts'
import { tokenize } from '../prepare/tokenize/index.ts'
import { Mention } from '../node/index.ts'
import { EOL } from '../node/misc.ts'
import { _LEGACY__parse } from '../prepare/parse/index.ts'

Deno.test('Parse Mentioning', async (context) => {
    const code = '@아두이노 모델명 보여주기'
    let tokens: ReturnType<typeof tokenize>

    await context.step('Tokenize', () => {
        tokens = tokenize(code, true)

        assertEquals(tokens.tokens, [
            new EOL(),
            new Expression('@'),
            new Keyword('아두이노'),
            new Keyword('모델명'),
            new Keyword('보여주기'),
            new EOL(),
        ])
    })

    await context.step('Parse Mentioning', () => {
        const parsed = _LEGACY__parse(tokens)

        assertEquals(parsed.children, [
            new EOL(),
            new Mention({
                name: new Keyword('아두이노'),
            }),
            new Keyword('모델명'),
            new Keyword('보여주기'),
            new EOL(),
            new EOL(),
        ])
    })
})

// console.log(
//     parse(
//         tokenize(
//             `
// 만약 @아두이노 모델명 = "Arduino Uno" 라면
//     @아두이노 버전 보여주기
// `,
//             true,
//         ),
//     ),
// )

// Deno.test('Mentioning', () => {
//     yaksok({
//         main: `@아두이노 모델명 보여주기
// `,
//         아두이노: `
// 모델명: "Arduino Uno"
// `,
//     })
// })