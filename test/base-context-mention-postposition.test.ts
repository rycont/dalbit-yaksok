import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert'

Deno.test(
    'base context variable used in mention with postposition splitting',
    async () => {
        let output = ''

        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        // Base context with a list variable
        await session.setBaseContext(
            `과일 = ["사과", "바나나", "딸기", "사과", "딸기", "사과"]`,
        )

        // Module with a function that uses postposition '로'
        session.addModule(
            '처리기',
            `약속, (데이터)로 처리하기
    데이터 보여주기`,
        )

        // Main module uses @mention with base context variable + postposition
        session.addModule(
            'main',
            `@처리기 과일로 처리하기`,
        )

        await session.runModule('main')

        assertEquals(output, '[사과, 바나나, 딸기, 사과, 딸기, 사과]\n')
    },
)

// Bug 2 검증: base context 변수('값')가 mentioned 모듈('도구')의 exportedRules에 포함되면,
// SR 파서가 '@도구 값'을 하나의 표현식으로 탐욕 매칭하여 '로 출력하기'가 고아 토큰이 됨 → 파싱 에러
Deno.test(
    'base context variable does not leak into mentioned module exported rules',
    async () => {
        let output = ''

        const session = new YaksokSession({
            stdout(message) {
                output += message + '\n'
            },
        })

        // Base context with a variable
        await session.setBaseContext(`값 = 42`)

        // Module with a function using postposition
        session.addModule(
            '도구',
            `약속, (데이터)로 출력하기
    데이터 보여주기`,
        )

        // Main uses @mention with the base context variable + postposition
        session.addModule(
            'main',
            `@도구 값로 출력하기`,
        )

        await session.runModule('main')

        assertEquals(output, '42\n')
    },
)
