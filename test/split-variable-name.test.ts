import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert'

Deno.test(
    'splits variable suffix for functions provided via base context',
    async () => {
        let output = ''

        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (사람)을 칭찬하기
    사람 + " 최고야" 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `사람 = "철수"
사람을 칭찬하기`.trim(),
        )

        await session.runModule('main')

        assertEquals(output, '철수 최고야\n')
    },
)

Deno.test(
    'splits variable suffix for functions imported via mentioning',
    async () => {
        let output = ''

        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        session.addModules({
            helper: `약속, (대상)을 칭찬하기
    대상 + " 최고야" 보여주기`,
            main: `대상 = "영희"
@helper 대상을 칭찬하기`,
        })

        await session.runModule('main')

        assertEquals(output, '영희 최고야\n')
    },
)
