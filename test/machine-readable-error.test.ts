import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { YaksokSession } from '../core/session/session.ts'
import { FEATURE_FLAG } from '../core/constant/feature-flags.ts'
import type { MachineReadableError } from '../core/error/index.ts'

Deno.test('Machine Readable Error Output', async () => {
    const errorOutputs: string[] = []

    const session = new YaksokSession({
        stderr: (message: string) => {
            errorOutputs.push(message)
        },
        flags: {
            [FEATURE_FLAG.MACHINE_READABLE_ERROR]: true,
        },
    })

    // 정의되지 않은 변수 사용으로 에러 발생시키기
    session.addModule('main', '정의되지않은변수 보여주기')

    await session.runModule('main')

    // 에러가 출력되었는지 확인
    assertEquals(errorOutputs.length, 1)

    const errorOutput = errorOutputs[0]

    // JSON으로 파싱 가능한지 확인
    const machineError: MachineReadableError = JSON.parse(errorOutput)

    // Machine Readable 형식 검증
    assertEquals(machineError.type, 'error')
    assertEquals(typeof machineError.message, 'string')
    assertEquals(machineError.message.length > 0, true)

    if (machineError.position) {
        assertEquals(typeof machineError.position.line, 'number')
        assertEquals(typeof machineError.position.column, 'number')
    }

    // ANSI 코드가 포함되지 않았는지 확인
    const ansiPattern = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m')
    assertEquals(
        ansiPattern.test(machineError.message),
        false,
        'Message should not contain ANSI codes',
    )

    console.log('✅ Machine Readable Error Output Test Passed')
    console.log('  - Message:', machineError.message)
})

Deno.test('Human Readable Error Output (Default)', async () => {
    const errorOutputs: string[] = []

    const session = new YaksokSession({
        stderr: (message: string) => {
            errorOutputs.push(message)
        },
        // Machine Readable 플래그를 설정하지 않음 (기본값: false)
    })

    // 정의되지 않은 변수 사용으로 에러 발생시키기
    session.addModule('main', '정의되지않은변수 보여주기')

    await session.runModule('main')

    // 에러가 출력되었는지 확인
    assertEquals(errorOutputs.length, 1)

    const errorOutput = errorOutputs[0]

    // JSON이 아니고 사람이 읽을 수 있는 형식이어야 함
    let isJson = false
    try {
        JSON.parse(errorOutput)
        isJson = true
    } catch {
        isJson = false
    }

    assertEquals(isJson, false)

    // Human Readable 형식의 특징 확인
    assertEquals(errorOutput.includes('🚨'), true)
    assertEquals(errorOutput.includes('문제가 발생했어요'), true)

    console.log('✅ Human Readable Error Output Test Passed')
})
