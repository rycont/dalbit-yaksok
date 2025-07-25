import { QuickJS } from '@dalbit-yaksok/quickjs'
import { assert, assertEquals, assertIsError } from '@std/assert'
import { FFIResultTypeIsNotForYaksokError } from '../core/error/ffi.ts'
import {
    ErrorOccurredWhileRunningFFIExecution,
    YaksokSession,
} from '../core/mod.ts'
import { ListValue } from '../core/value/list.ts'
import { NumberValue, StringValue } from '../core/value/primitive.ts'

Deno.test('연결 문법을 사용하여 자바스크립트 함수 호출', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend(
        new QuickJS({
            prompt: () => {
                return '10'
            },
        }),
    )

    session.addModule(
        'main',
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
    )

    await session.runModule('main')

    assertEquals(
        output,
        '10개는 너무 적으니, 7개 더 먹어서 17개 먹어야 겠어요.\n',
    )
})

Deno.test('다른 파일에 있는 연결 호출', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend(
        new QuickJS({
            prompt: () => {
                return '황선형'
            },
        }),
    )

    session.addModule(
        '유틸',
        `번역(QuickJS), (질문) 물어보기
***
    return prompt()
***`,
    )

    session.addModule(
        'main',
        `(@유틸 ("이름이 뭐에요?") 물어보기) 보여주기
`,
    )

    await session.runModule('main')

    assertEquals(output, '황선형\n')
})

Deno.test('배열을 반환하는 연결', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'mock',
            },
        },
        executeFFI() {
            return new ListValue([
                new StringValue('황선형'),
                new StringValue('도지석'),
            ])
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
RRR
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )

    await session.runModule('main')

    assertEquals(output, '[황선형, 도지석]\n')
})

Deno.test('올바르지 않은 연결 반환값: JS String', async () => {
    const session = new YaksokSession()

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'mock',
            },
        },
        executeFFI() {
            return 'invalid value' as any
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
SOMETHING
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )

    const result = await session.runModule('main')
    console.log(result)
    assert(result.reason === 'error')
    assertIsError(result.error, FFIResultTypeIsNotForYaksokError)
})

Deno.test('올바르지 않은 연결 반환값: JS Object', async () => {
    const session = new YaksokSession()

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'mock',
            },
        },
        executeFFI() {
            return {} as any
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )

    const result = await session.runModule('main')
    assert(result.reason === 'error')
    assertIsError(result.error, FFIResultTypeIsNotForYaksokError)
})

Deno.test('연결 반환값이 없음', async () => {
    const session = new YaksokSession()

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'mock',
            },
        },
        executeFFI() {
            return undefined as any
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )

    const result = await session.runModule('main')
    assert(result.reason === 'error')
    assertIsError(result.error, FFIResultTypeIsNotForYaksokError)
})

Deno.test('구현되지 않은 FFI', async () => {
    const session = new YaksokSession()

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'mock',
            },
        },
        executeFFI() {
            throw new Error('Not implemented')
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )

    const result = await session.runModule('main')
    assert(result.reason === 'error')
    assertIsError(result.error, ErrorOccurredWhileRunningFFIExecution)
})

Deno.test('Promise를 반환하는 FFI', async () => {
    const output: string[] = []

    const startTime = +new Date()

    const session = new YaksokSession({
        stdout(value) {
            output.push(value)
        },
    })

    await session.extend({
        manifest: {
            ffiRunner: {
                runtimeName: 'Runtime',
            },
        },
        executeFFI(_code, args) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(new NumberValue(0))
                }, (args.숫자 as NumberValue).value * 1000)
            })
        },
        init() {
            return Promise.resolve()
        },
    })

    session.addModule(
        'main',
        `번역(Runtime), (숫자)초 기다리기
***
wait
***
"안녕!" 보여주기
1초 기다리기
"반가워!" 보여주기
`,
    )

    await session.runModule('main')

    const timeDelta = +new Date() - startTime

    assert(timeDelta < 2000)
    assert(999 < timeDelta)

    assertEquals(output, ['안녕!', '반가워!'])
})

Deno.test('한 단어로 된 FFI 이름', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend(
        new QuickJS({
            prompt: () => {
                return '성공'
            },
        }),
    )

    session.addModule(
        'main',
        `번역(QuickJS), 물어보기
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
    )

    await session.runModule('main')

    assertEquals(
        output,
        '성공성공성공성공\n이건 아님이건 아님이건 아님이건 아님\n',
    )
})

Deno.test('이름에 변형이 있는 함수 선언', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend(new QuickJS())

    session.addModule(
        'main',
        `번역(QuickJS), 지금/현재 시간 가져오기
***
    return 1743823961
***
번역(QuickJS), 지금/현재 밀리초 가져오기
***
    return 1743823977546
***
지금 시간 가져오기 보여주기
현재 시간 가져오기 보여주기
지금 밀리초 가져오기 보여주기
현재 밀리초 가져오기 보여주기
`,
    )

    await session.runModule('main')

    assertEquals(
        output,
        '1743823961\n1743823961\n1743823977546\n1743823977546\n',
    )
})
