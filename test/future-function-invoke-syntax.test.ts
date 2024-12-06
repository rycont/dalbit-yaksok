import { equal } from 'assert'
import { yaksok } from '../src/mod.ts'

Deno.test('미래의 약속 호출 문법', async () => {
    let output = ''

    await yaksok(
        `약속, (A)와 (B)를 더하기
    결과: A + B

(4)와 (5)를 더하기 보여주기`,
        {
            flags: {
                'future-function-invoke-syntax': true,
            },
            stdout(value) {
                output += value + '\n'
            },
        },
    )

    equal(output, '9\n')
})
