import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { YaksokSession } from '../core/mod.ts'
import { QuickJS } from '../quickjs/mod.ts'
import { DEFAULT_RUNTIME_CONFIG } from '../core/runtime/runtime-config.ts'

Deno.test('YaksokSession with QuickJS FFI', async () => {
    const mockPromptResponses: string[] = ['달빛', '']
    let promptCallCount = 0
    const prompt = (message: string): string => {
        console.log(`Prompt: ${message}`)
        const response = mockPromptResponses[promptCallCount]
        promptCallCount++
        return response
    }

    const quickjs = new QuickJS({ prompt })
    await quickjs.init()

    let lastStdout = ''
    const runtime = new YaksokSession({}, {
        runFFI: (_, code, args) => {
            return quickjs.run(code, args)
        },
        stdout: (output: string) => {
            console.log('STDOUT:', output)
            lastStdout = output
        },
    })

    await runtime.runModule('상수', `
내_이름 = "달빛"
`)
    assertEquals(runtime.entryPoint, '상수', "EntryPoint should be the last module loaded by runModule")

    const constantsModule = runtime.getCodeFile('상수')
    assertEquals(constantsModule.fileName, '상수') // .name -> .fileName

    // FFI 함수 정의와 사용을 하나의 run 호출로 합침
    // Test the main logic - correct answer
    promptCallCount = 0
    mockPromptResponses[0] = "달빛"
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
    assertEquals(runtime.entryPoint, '상수', "EntryPoint should still be the module name after direct code run")

    // Test incorrect answer
    promptCallCount = 0
    mockPromptResponses[0] = "별빛"
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
    assertEquals(runtime.entryPoint, '상수', "EntryPoint should still be the module name after another direct code run")
})

Deno.test('YaksokSession run code directly without initial files', async () => {
    let output = ''
    const runtime = new YaksokSession({}, { // codeTexts가 비어있음
        stdout: (msg: string) => {
            output += msg
        },
    })
    // 생성자에서 codeTexts가 비어있고 config에 entryPoint가 명시되지 않으면 DEFAULT_RUNTIME_CONFIG.entryPoint ('main')을 사용
    assertEquals(runtime.entryPoint, DEFAULT_RUNTIME_CONFIG.entryPoint, `Initial entryPoint should be ${DEFAULT_RUNTIME_CONFIG.entryPoint}`)

    await runtime.run('"헬로월드" 보여주기')
    assertEquals(output, '헬로월드')
    assertEquals(Object.keys(runtime.files).length, 0, "Temporary file should be removed")
    // 임시 실행 후 파일이 없으면 entryPoint는 DEFAULT_RUNTIME_CONFIG.entryPoint로 복원됨
    assertEquals(runtime.entryPoint, DEFAULT_RUNTIME_CONFIG.entryPoint, `EntryPoint should revert to ${DEFAULT_RUNTIME_CONFIG.entryPoint} after temporary run with no other files`)
})

Deno.test('YaksokSession runModule and access variables', async () => {
    let output = ''
    const runtime = new YaksokSession({}, {
        stdout: (msg: string) => {
            output += msg
        },
    })
    assertEquals(runtime.entryPoint, DEFAULT_RUNTIME_CONFIG.entryPoint, "Initial entryPoint")

    await runtime.runModule('테스트모듈', '변수 = 123')
    assertEquals(runtime.entryPoint, '테스트모듈', "EntryPoint after runModule")
    assertEquals(Object.keys(runtime.files).includes('테스트모듈'), true, "Module should be loaded")

    output = ''
    await runtime.run('@테스트모듈 변수 보여주기')
    assertEquals(output, '123')
    assertEquals(runtime.entryPoint, '테스트모듈', "EntryPoint should remain '테스트모듈' after running code that references it")
})

Deno.test('YaksokSession run code directly after runModule', async () => {
    let output = ''
    const runtime = new YaksokSession({}, {
        stdout: (msg: string) => {
            output += msg
        },
    })

    await runtime.runModule('테스트모듈', '모듈변수 = "모듈값"')
    assertEquals(runtime.entryPoint, '테스트모듈', "EntryPoint should be '테스트모듈' after runModule")

    output = ''
    await runtime.run('"직접실행" 보여주기')
    assertEquals(output, '직접실행')
    // 임시 코드 실행 후, entryPoint는 originalEntryPoint ('테스트모듈')로 복원되어야 함
    assertEquals(runtime.entryPoint, '테스트모듈', "EntryPoint should revert to '테스트모듈' after temporary run")
    assertEquals(Object.keys(runtime.files).length, 1, "Only module file should remain")
    assertEquals(Object.keys(runtime.files)[0], '테스트모듈', "Module file name should be correct")
})

Deno.test('YaksokSession run existing file', async () => {
    let output = ''
    const runtime = new YaksokSession(
        { '메인.yak': '"메인파일 실행됨" 보여주기' },
        {
            stdout: (msg: string) => { output += msg },
            entryPoint: '메인.yak'
        }
    );
    assertEquals(runtime.entryPoint, '메인.yak', "Initial entryPoint with specified file");

    await runtime.run(); // entryPoint '메인.yak' 실행
    assertEquals(output, '메인파일 실행됨');
    assertEquals(runtime.entryPoint, '메인.yak', "EntryPoint should remain '메인.yak' after running it");

    output = '';
    await runtime.run('"다른거 실행" 보여주기');
    assertEquals(output, '다른거 실행');
    assertEquals(runtime.entryPoint, '메인.yak', "EntryPoint should revert to '메인.yak' after temporary run");
});

Deno.test('YaksokSession constructor with specific entryPoint and codeTexts', async () => {
    const runtime = new YaksokSession(
        {
            'file1.yak': '변수1 = 1',
            'file2.yak': '변수2 = 2',
        },
        { entryPoint: 'file2.yak' }
    );
    assertEquals(runtime.entryPoint, 'file2.yak', "EntryPoint should be 'file2.yak' as specified in config");
    await runtime.run(); // file2.yak 실행
    // stdout 등 확인 로직 추가 가능
});

Deno.test('YaksokSession constructor with codeTexts but no explicit entryPoint', async () => {
    const runtime = new YaksokSession(
        {
            'fileA.yak': '변수A = "a"',
            'fileB.yak': '변수B = "b"',
        }
        // config에 entryPoint 명시 안함
    );
    // codeTexts가 있고 entryPoint 명시 안하면 첫번째 파일(fileA.yak)이 entryPoint
    assertEquals(runtime.entryPoint, 'fileA.yak', "EntryPoint should be the first file if not specified in config");
    await runtime.run();
});
