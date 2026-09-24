import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { YaksokSession } from '../core/session/session.ts'
import type { MachineReadableError } from '../core/error/index.ts'

Deno.test('Machine Readable Error Output (as second argument)', async () => {
    const errorOutputs: Array<{
        human: string
        machine: MachineReadableError
    }> = []

    const session = new YaksokSession({
        stderr: (message: string, machineReadable: MachineReadableError) => {
            errorOutputs.push({
                human: message,
                machine: machineReadable,
            })
        },
    })

    // 정의되지 않은 변수 사용으로 에러 발생시키기
    session.addModule('main', '정의되지않은변수 보여주기')

    await session.runModules(['main'])

    // 에러가 출력되었는지 확인
    assertEquals(errorOutputs.length, 1)

    const { human, machine } = errorOutputs[0]

    // Human Readable 형식 검증
    assertEquals(human.includes('🚨'), true)
    assertEquals(human.includes('문제가 발생했어요'), true)

    // Machine Readable이 오브젝트임을 확인
    assertEquals(typeof machine, 'object')

    // Machine Readable 형식 검증
    assertEquals(typeof machine.message, 'string')
    assertEquals(machine.message.length > 0, true)

    if (machine.position) {
        const [line, column] = machine.position.split(':').map(Number)
        assertEquals(line, 1)
        assertEquals(column, 1)
    }

    // ANSI 코드가 포함되지 않았는지 확인
    const ansiPattern = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m')
    assertEquals(
        ansiPattern.test(machine.message),
        false,
        'Message should not contain ANSI codes',
    )

    console.log('✅ Machine Readable Error Output Test Passed')
    console.log('  - Human:', human.split('\n')[0])
    console.log(
        '  - Machine:',
        JSON.stringify(machine).substring(0, 100) + '...',
    )
})

Deno.test('Human Readable Error Output (first argument)', async () => {
    const errorOutputs: Array<{
        human: string
        machine: MachineReadableError
    }> = []

    const session = new YaksokSession({
        stderr: (message: string, machineReadable: MachineReadableError) => {
            errorOutputs.push({
                human: message,
                machine: machineReadable,
            })
        },
    })

    // 정의되지 않은 변수 사용으로 에러 발생시키기
    session.addModule('main', '정의되지않은변수 보여주기')

    await session.runModules(['main'])

    // 에러가 출력되었는지 확인
    assertEquals(errorOutputs.length, 1)

    const { human, machine } = errorOutputs[0]

    // Human Readable 형식의 특징 확인
    assertEquals(human.includes('🚨'), true)
    assertEquals(human.includes('문제가 발생했어요'), true)

    // Human Readable 형식은 JSON이 아님
    let isJson = false
    try {
        JSON.parse(human)
        isJson = true
    } catch {
        isJson = false
    }

    assertEquals(isJson, false)

    // Machine Readable은 항상 오브젝트로 전달됨
    assertEquals(typeof machine, 'object')

    console.log('✅ Human Readable Error Output Test Passed')
})
