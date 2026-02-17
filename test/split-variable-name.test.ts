import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert'

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

Deno.test(
    'prevents splitting when lookahead markers do not match',
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
사람은 = "영희"
사람은 보여주기`.trim(),
        )

        await session.runModule('main')
        assertEquals(output, '영희\n')
    },
)

Deno.test(
    'correctly splits even with lookahead when markers match',
    async () => {
        let output = ''
        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (대상)를/을 (이름)으로 바꾸기
    이름 + " 최고야" 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `이름 = "철수"
"영희"를 이름으로 바꾸기`.trim(),
        )

        await session.runModule('main')
        assertEquals(output, '철수 최고야\n')
    },
)

Deno.test(
    'splits variable name when followed by parameter in parentheses with spaces',
    async () => {
        let output = ''
        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (사람)을 (표현) 칭찬하기
    사람 + "에게 " + 표현 + "라고 말하기" 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `이름 = "영희"
이름을 ( "최고야" ) 칭찬하기`.trim(),
        )

        await session.runModule('main')
        assertEquals(output, '영희에게 최고야라고 말하기\n')
    },
)

Deno.test(
    'splits variable name when followed by a list literal (Sequence)',
    async () => {
        let output = ''
        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (사람)과 (목록) 출력하기
    사람 보여주기
    목록 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `이름 = "철수"
이름과 [4, 5] 출력하기`.trim(), // '이름과' should split because of the following list
        )

        await session.runModule('main')
        assertEquals(output, '철수\n[4, 5]\n')
    },
)

Deno.test(
    'splits variable name for complex evaluable nodes (indexed access)',
    async () => {
        let output = ''
        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (대상)을 호출하기
    대상 + " 호출됨" 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `목록 = ["A", "B"]
목록[0]을 호출하기`.trim(),
        )

        await session.runModule('main')
        assertEquals(output, 'A 호출됨\n')
    },
)

Deno.test(
    'prevents splitting when followed by an assignment operator',
    async () => {
        let output = ''
        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        await session.setBaseContext(
            `약속, (사람)을 칭찬하기
    사람 + " 최고" 보여주기`.trim(),
        )

        session.addModule(
            'main',
            `사람은 = "철수"
사람은 보여주기`.trim(), // '사람은' should NOT split into '사람' + '은' here
        )

        await session.runModule('main')
        assertEquals(output, '철수\n')
    },
)
