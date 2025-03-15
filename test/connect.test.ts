import { assertEquals, assertIsError, assert } from '@std/assert'
import { QuickJS } from '@dalbit-yaksok/quickjs'
import { yaksok } from '../core/mod.ts'
import { FFIResultTypeIsNotForYaksokError } from '../core/error/ffi.ts'
import { NumberValue, StringValue } from '../core/value/primitive.ts'
import { ListValue } from '../core/value/list.ts'

const quickJS = new QuickJS({
    prompt: () => {
        return '10'
    },
})

await quickJS.init()

Deno.test('연결 문법을 사용하여 자바스크립트 함수 호출', async () => {
    let output = ''
    await yaksok(
        `
번역(QuickJS), (질문) 물어보기
***
    return prompt()
***

번역(QuickJS), (문자)를 숫자로 바꾸기
***
    return parseInt(문자, 10)
***

번역(QuickJS), (최소)와 (최대) 사이의 랜덤한 수
***
    return 7
***

먹고싶은_사과_수 = (("사과 몇 개 먹고 싶어요?") 물어보기)를 숫자로 바꾸기
덤_사과_수 = (1)와 (10) 사이의 랜덤한 수

먹고싶은_사과_수 + "개는 너무 적으니, " + 덤_사과_수 + "개 더 먹어서 " + (먹고싶은_사과_수 + 덤_사과_수) + "개 먹어야 겠어요." 보여주기
`,
        {
            runFFI(runtime, bodyCode, args) {
                if (runtime === 'QuickJS') {
                    const result = quickJS.run(bodyCode, args)
                    if (!result) {
                        throw new Error('Result is null')
                    }

                    return result
                }

                throw new Error(`Unknown runtime: ${runtime}`)
            },
            stdout(value) {
                output += value + '\n'
            },
        },
    )

    assertEquals(
        output,
        '10개는 너무 적으니, 7개 더 먹어서 17개 먹어야 겠어요.\n',
    )
})

Deno.test('다른 파일에 있는 연결 호출', async () => {
    let output = ''
    await yaksok(
        {
            유틸: `번역(QuickJS), (질문) 물어보기
***
    return "황선형"
***`,
            main: `
(@유틸 ("이름이 뭐에요?") 물어보기) 보여주기
            `,
        },
        {
            runFFI(runtime, bodyCode, args) {
                if (runtime === 'QuickJS') {
                    const result = quickJS.run(bodyCode, args)
                    if (!result) {
                        throw new Error('Result is null')
                    }

                    return result
                }

                throw new Error(`Unknown runtime: ${runtime}`)
            },
            stdout(value) {
                output += value + '\n'
            },
        },
    )

    assertEquals(output, '황선형\n')
})

Deno.test('배열을 반환하는 연결', async () => {
    let output = ''
    await yaksok(
        `
번역(QuickJS), (질문) 물어보기
***
CODES
***

(("이름이 뭐에요?") 물어보기) 보여주기`,
        {
            runFFI() {
                return new ListValue([
                    new StringValue('황선형'),
                    new StringValue('도지석'),
                ])
            },
            stdout(value) {
                output += value + '\n'
            },
        },
    )

    assertEquals(output, '[황선형, 도지석]\n')
})

Deno.test('올바르지 않은 연결 반환값: JS String', async () => {
    try {
        await yaksok(
            `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
            {
                runFFI(runtime) {
                    if (runtime === 'mock') {
                        return 'invalid value' as any
                    }

                    throw new Error(`Unknown runtime: ${runtime}`)
                },
            },
        )
    } catch (e) {
        assertIsError(e, FFIResultTypeIsNotForYaksokError)
    }
})

Deno.test('올바르지 않은 연결 반환값: JS Object', async () => {
    try {
        await yaksok(
            `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
            {
                runFFI(runtime) {
                    if (runtime === 'mock') {
                        return {} as any
                    }

                    throw new Error(`Unknown runtime: ${runtime}`)
                },
            },
        )
    } catch (e) {
        assertIsError(e, FFIResultTypeIsNotForYaksokError)
    }
})

Deno.test('연결 반환값이 없음', async () => {
    try {
        await yaksok(
            `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
            {
                runFFI(runtime) {
                    if (runtime === 'mock') {
                        return undefined as any
                    }

                    throw new Error(`Unknown runtime: ${runtime}`)
                },
            },
        )
    } catch (e) {
        assertIsError(e, FFIResultTypeIsNotForYaksokError)
    }
})

Deno.test('구현되지 않은 FFI', async () => {
    try {
        await yaksok(
            `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
        )
    } catch (e) {
        assertIsError(e)
    }
})

Deno.test('Promise를 반환하는 FFI', async () => {
    const output: string[] = []

    const startTime = +new Date()

    await yaksok(
        `
번역(Runtime), (숫자)초 기다리기
***
wait
***

"안녕!" 보여주기
1초 기다리기
"반가워!" 보여주기
`,
        {
            async runFFI(_runtime, _code, args) {
                await new Promise((ok) =>
                    setTimeout(ok, (args.숫자 as NumberValue).value * 1000),
                )

                return new NumberValue(0)
            },
            stdout(message) {
                output.push(message)
            },
        },
    )

    const timeDelta = +new Date() - startTime

    assert(timeDelta < 2000)
    assert(1000 < timeDelta)

    assertEquals(output, ['안녕!', '반가워!'])
})

Deno.test('한 단어로 된 FFI 이름', async () => {
    let output = ''
    await yaksok(
        `
번역(QuickJS), 물어보기
***
    return "성공"
***

번역(QuickJS), (질문) 물어보기
***
    return "이건 아님"
***

(물어보기) + 물어보기 * 3 보여주기
("뭐라도" 물어보기) + ("뭐라도" 물어보기) * 3 보여주기
`,
        {
            runFFI(runtime, bodyCode, args) {
                if (runtime === 'QuickJS') {
                    const result = quickJS.run(bodyCode, args)
                    if (!result) {
                        throw new Error('Result is null')
                    }

                    return result
                }

                throw new Error(`Unknown runtime: ${runtime}`)
            },
            stdout(value) {
                output += value + '\n'
            },
        },
    )

    assertEquals(
        output,
        '성공성공성공성공\n이건 아님이건 아님이건 아님이건 아님\n',
    )
})
