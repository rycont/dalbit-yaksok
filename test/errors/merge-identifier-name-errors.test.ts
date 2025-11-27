import { YaksokSession, type MachineReadableError } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert/equals'

Deno.test('Merge identifier name errors', async () => {
    const machineReadables: MachineReadableError[] = []

    const session = new YaksokSession({
        stderr: (_, machineReadable) => {
            machineReadables.push(machineReadable)
        },
    })

    session.addModule('main', `정의 되지 않은 약속`)
    await session.runModule('main')

    assertEquals(machineReadables.length, 1)
    assertEquals(
        machineReadables[0].message,
        '"정의 되지 않은 약속"라는 변수나 약속을 찾을 수 없어요.',
    )
})
