import {
    assertEquals,
    assertRejects,
    assertThrows,
} from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { YaksokSession } from '../core/mod.ts'
import { QuickJS } from '../quickjs/mod.ts'
import { DEFAULT_RUNTIME_CONFIG } from '../core/runtime/runtime-config.ts'
import { FileForRunNotExistError } from '../core/error/prepare.ts'
import { ErrorGroups } from '../core/error/validation.ts'

Deno.test('YaksokSession with QuickJS FFI', async () => {
    const mockPromptResponses: string[] = ['달빛', '']
    let promptCallCount = 0
    const prompt = (message: string): string => {
        console.log(`Prompt: ${message}`)
        const response = mockPromptResponses[promptCallCount]
        promptCallCount++
        return response
    }

    let lastStdout = ''
    const runtime = new YaksokSession(
        {},
        {
            stdout: (output: string) => {
                console.log('STDOUT:', output)
                lastStdout = output
            },
        },
    )

    await runtime.extend(new QuickJS({ prompt }))

    const 상수module = runtime.addModule(
        '상수',
        `
내_이름 = "달빛"
`,
    )
    assertEquals(상수module.fileName, '상수')
    // addModule은 entryPoint를 변경하지 않으므로, 이전 entryPoint 또는 기본값을 유지해야 함
    // 여기서는 초기화 시 {}를 전달했으므로 기본 entryPoint인 'main'이 되어야 함.
    assertEquals(
        runtime.entryPoint,
        DEFAULT_RUNTIME_CONFIG.entryPoint,
        'EntryPoint should be default after addModule',
    )

    await runtime.runModule('상수') // 이제 '상수' 모듈을 실행, entryPoint가 '상수'로 변경됨
    assertEquals(
        runtime.entryPoint,
        '상수',
        "EntryPoint should be '상수' after runModule('상수')",
    )

    promptCallCount = 0
    mockPromptResponses[0] = '달빛'
    await runtime.run(`
번역(QuickJS), (문장) 물어보기
***
    return prompt(문장)
***

문장 = ("내 이름이 뭐라고?") 물어보기
만약 문장 == @상수 내_이름 이면
    "정답입니다!" 보여주기
아니면
    "틀렸습니다. 다시 시도하세요." 보여주기
`)
    assertEquals(lastStdout, '정답입니다!')
    assertEquals(
        runtime.entryPoint,
        '상수',
        'EntryPoint should still be the module name after direct code run',
    )

    promptCallCount = 0
    mockPromptResponses[0] = '별빛'
    await runtime.run(`
번역(QuickJS), (문장) 물어보기
***
    return prompt(문장)
***

문장 = ("내 이름이 뭐라고?") 물어보기
만약 문장 == @상수 내_이름 이면
    "정답입니다!" 보여주기
아니면
    "틀렸습니다. 다시 시도하세요." 보여주기
`)
    assertEquals(lastStdout, '틀렸습니다. 다시 시도하세요.')
    assertEquals(
        runtime.entryPoint,
        '상수',
        'EntryPoint should still be the module name after another direct code run',
    )
})

Deno.test('YaksokSession run code directly without initial files', async () => {
    let output = ''
    const runtime = new YaksokSession(
        {},
        {
            stdout: (msg: string) => {
                output += msg
            },
        },
    )
    assertEquals(
        runtime.entryPoint,
        DEFAULT_RUNTIME_CONFIG.entryPoint,
        `Initial entryPoint should be ${DEFAULT_RUNTIME_CONFIG.entryPoint}`,
    )

    await runtime.run('"헬로월드" 보여주기')
    assertEquals(output, '헬로월드')
    assertEquals(
        Object.keys(runtime.files).length,
        0,
        'Temporary file should be removed',
    )
    assertEquals(
        runtime.entryPoint,
        DEFAULT_RUNTIME_CONFIG.entryPoint,
        `EntryPoint should revert to ${DEFAULT_RUNTIME_CONFIG.entryPoint} after temporary run with no other files`,
    )
})

Deno.test('YaksokSession runModule and access variables', async () => {
    let output = ''
    const runtime = new YaksokSession(
        {},
        {
            stdout: (msg: string) => {
                output += msg
            },
        },
    )
    assertEquals(
        runtime.entryPoint,
        DEFAULT_RUNTIME_CONFIG.entryPoint,
        'Initial entryPoint',
    )

    runtime.addModule('테스트모듈', '변수 = 123')
    await runtime.runModule('테스트모듈') // 수정: addModule 후 runModule 호출
    assertEquals(runtime.entryPoint, '테스트모듈', 'EntryPoint after runModule')
    assertEquals(
        Object.keys(runtime.files).includes('테스트모듈'),
        true,
        'Module should be loaded',
    )

    output = ''
    await runtime.run('@테스트모듈 변수 보여주기')
    assertEquals(output, '123')
    assertEquals(
        runtime.entryPoint,
        '테스트모듈',
        "EntryPoint should remain '테스트모듈' after running code that references it",
    )
})

Deno.test('YaksokSession run code directly after runModule', async () => {
    let output = ''
    const runtime = new YaksokSession(
        {},
        {
            stdout: (msg: string) => {
                output += msg
            },
        },
    )

    runtime.addModule('테스트모듈', '모듈변수 = "모듈값"')
    await runtime.runModule('테스트모듈') // 수정: addModule 후 runModule 호출
    assertEquals(
        runtime.entryPoint,
        '테스트모듈',
        "EntryPoint should be '테스트모듈' after runModule",
    )

    output = ''
    await runtime.run('"직접실행" 보여주기')
    assertEquals(output, '직접실행')
    assertEquals(
        runtime.entryPoint,
        '테스트모듈',
        "EntryPoint should revert to '테스트모듈' after temporary run",
    )
    assertEquals(
        Object.keys(runtime.files).length,
        1,
        'Only module file should remain',
    )
    assertEquals(
        Object.keys(runtime.files)[0],
        '테스트모듈',
        'Module file name should be correct',
    )
})

Deno.test('YaksokSession run existing file', async () => {
    let output = ''
    const runtime = new YaksokSession(
        { '메인.yak': '"메인파일 실행됨" 보여주기' },
        {
            stdout: (msg: string) => {
                output += msg
            },
            entryPoint: '메인.yak',
        },
    )
    assertEquals(
        runtime.entryPoint,
        '메인.yak',
        'Initial entryPoint with specified file',
    )

    await runtime.run()
    assertEquals(output, '메인파일 실행됨')
    assertEquals(
        runtime.entryPoint,
        '메인.yak',
        "EntryPoint should remain '메인.yak' after running it",
    )

    output = ''
    await runtime.run('"다른거 실행" 보여주기')
    assertEquals(output, '다른거 실행')
    assertEquals(
        runtime.entryPoint,
        '메인.yak',
        "EntryPoint should revert to '메인.yak' after temporary run",
    )
})

Deno.test(
    'YaksokSession constructor with specific entryPoint and codeTexts',
    async () => {
        const runtime = new YaksokSession(
            {
                'file1.yak': '변수1 = 1',
                'file2.yak': '변수2 = 2',
            },
            { entryPoint: 'file2.yak' },
        )
        assertEquals(
            runtime.entryPoint,
            'file2.yak',
            "EntryPoint should be 'file2.yak' as specified in config",
        )
        await runtime.run()
    },
)

Deno.test(
    'YaksokSession constructor with codeTexts but no explicit entryPoint',
    async () => {
        const runtime = new YaksokSession({
            'fileA.yak': '변수A = "a"',
            'fileB.yak': '변수B = "b"',
        })
        assertEquals(
            runtime.entryPoint,
            'fileA.yak',
            'EntryPoint should be the first file if not specified in config',
        )
        await runtime.run()
    },
)

Deno.test('YaksokSession run non-existent entryPoint file', async () => {
    const runtime = new YaksokSession({}, { entryPoint: 'nonExistent.yak' })
    await assertRejects(
        async () => {
            await runtime.run()
        },
        FileForRunNotExistError,
        'nonExistent.yak',
    )
})

Deno.test('YaksokSession validate method', () => {
    const runtime = new YaksokSession()
    runtime.addModule('validModule', '"유효한 코드" 보여주기')
    runtime.addModule('invalidModule', '잘못된 코드 =') // 구문 오류

    // 1. entrypoint 없이 validate() 호출 - 전체 검증 (오류 있는 경우)
    assertThrows(() => {
        runtime.validate()
    }, ErrorGroups)

    // 2. 특정 유효한 entrypoint로 validate() 호출
    runtime.validate('validModule') // 오류 발생하지 않아야 함

    // 3. 특정 유효하지 않은 entrypoint로 validate() 호출
    assertThrows(() => {
        runtime.validate('invalidModule')
    }, ErrorGroups)

    // 4. 존재하지 않는 entrypoint로 validate() 호출
    assertThrows(
        () => {
            runtime.validate('nonExistentModule')
        },
        FileForRunNotExistError,
        'nonExistentModule',
    )

    // 5. 오류 없는 전체 검증
    const validRuntime = new YaksokSession()
    validRuntime.addModule('mod1', 'ㄱ = 1')
    validRuntime.addModule('mod2', 'ㄴ = @mod1 ㄱ')
    validRuntime.validate() // 오류 발생하지 않아야 함
})

Deno.test('YaksokSession run non-existent file by name', async () => {
    const runtime = new YaksokSession({ 'actual.yak': '' })
    await assertRejects(
        async () => {
            await runtime.run('nonExistent.yak')
        },
        FileForRunNotExistError,
        'nonExistent.yak',
    )
})
