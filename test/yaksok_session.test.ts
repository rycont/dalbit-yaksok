import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { YaksokSession } from '../core/mod.ts'
import { QuickJS } from '../quickjs/mod.ts'

Deno.test('YaksokSession with QuickJS FFI', async () => {
    const mockPromptResponses: string[] = ['달빛']
    let promptCallCount = 0
    const prompt = (message: string): string => {
        console.log(`Prompt: ${message}`)
        const response = mockPromptResponses[promptCallCount]
        promptCallCount++
        return response
    }

    const quickjs = new QuickJS({ prompt })
    await quickjs.init()

    const runtime = new YaksokSession({}, { // Pass empty object for codeTexts
        runFFI: (_, code, args) => {
            return quickjs.run(code, args)
        },
        stdout: (output: string) => {
            // For tests, we might want to capture stdout
            // For now, just log it or assert specific outputs
            console.log('STDOUT:', output)
            if (output.includes('정답입니다!')) {
                assertEquals(output, '정답입니다!')
            } else if (output.includes('틀렸습니다.')) {
                assertEquals(output, '틀렸습니다. 다시 시도하세요.')
            }
        },
    })

    await runtime.runModule('상수', `
내_이름 = "달빛"
`)

    // Check if module is loaded correctly
    const constantsModule = runtime.getCodeFile('상수')
    assertEquals(constantsModule.name, '상수')

    await runtime.run(`
번역(QuickJS), (문장) 물어보기
***
    return prompt(문장)
***
`)

    // Test the main logic
    mockPromptResponses[0] = '달빛'
    promptCallCount = 0
    await runtime.run(`
문장 = ("내 이름이 뭐라고?") 물어보기
만약 문장 == @상수 내_이름 이면
    "정답입니다!" 보여주기
아니면
    "틀렸습니다. 다시 시도하세요." 보여주기
`)

    // Test incorrect answer
    mockPromptResponses[0] = '별빛'
    promptCallCount = 0
    await runtime.run(`
문장 = ("내 이름이 뭐라고?") 물어보기
만약 문장 == @상수 내_이름 이면
    "정답입니다!" 보여주기
아니면
    "틀렸습니다. 다시 시도하세요." 보여주기
`)
})

Deno.test('YaksokSession run code directly', async () => {
    let output = ''
    const runtime = new YaksokSession({}, {
        stdout: (msg: string) => {
            output += msg
        },
    })

    await runtime.run('"헬로월드" 보여주기')
    assertEquals(output, '헬로월드')
})

Deno.test('YaksokSession runModule and access variables', async () => {
    let output = ''
    const runtime = new YaksokSession({}, {
        stdout: (msg: string) => {
            output += msg
        },
    })

    await runtime.runModule('테스트모듈', '변수 = 123')
    await runtime.run('@테스트모듈 변수 보여주기')
    assertEquals(output, '123')
})
