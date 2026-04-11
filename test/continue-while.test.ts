import { assertEquals } from '@std/assert'
import { YaksokSession } from '@dalbit-yaksok/core'
import { StandardExtension } from '../exts/standard/mod.ts'

async function run(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
        stderr(value) {
            console.error(value)
        },
    })

    const standard = new StandardExtension()
    await session.extend(standard)
    await session.setBaseContext(standard.manifest.module!['표준'])

    session.addModule('main', code)
    await session.runModule('main')

    return output.trim()
}

Deno.test('다음 반복 - 범위 반복에서 특정 값 건너뛰기', async () => {
    // i == 3 일 때 건너뛰어서 1,2,4,5 출력
    const code = `
반복 1~5 의 i 마다
    만약 i == 3 이면
        다음 반복
    i 보여주기
`
    const result = await run(code)
    assertEquals(result, '1\n2\n4\n5')
})

Deno.test('반복 [조건] 동안 - while 루프', async () => {
    const code = `
i = 1
반복 i <= 5 동안
    i 보여주기
    i = i + 1
`
    const result = await run(code)
    assertEquals(result, '1\n2\n3\n4\n5')
})

Deno.test('에라토스테네스의 체 - 반복 [조건] 동안 활용', async () => {
    const code = `
최대 = 30
소수여부 = []
반복 0~최대 의 i 마다
    소수여부.(참) 추가하기
소수여부[0] = 거짓
소수여부[1] = 거짓
반복 2~최대 의 i 마다
    만약 소수여부[i] 이면
        j = i + i
        반복 j <= 최대 동안
            소수여부[j] = 거짓
            j = j + i
반복 2~최대 의 i 마다
    만약 소수여부[i] 이면
        i 보여주기
`
    const result = await run(code)
    assertEquals(result, '2\n3\n5\n7\n11\n13\n17\n19\n23\n29')
})
