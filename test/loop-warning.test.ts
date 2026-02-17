import { type WarningEvent, YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'
import { assertEquals } from '@std/assert/equals'

Deno.test(
    'Standard loop emits warning after exceeding 256 iterations',
    async () => {
        const warnings: WarningEvent[] = []

        const session = new YaksokSession({
            stdout: () => {},
            events: {
                warning(warning) {
                    warnings.push(warning)
                },
            },
        })

        session.addModule(
            'main',
            `
카운터 = 0
반복
    만약 카운터 >= 260 이면
        반복 그만
    카운터 = 카운터 + 1
`,
        )

        await session.runModule('main')

        assertEquals(warnings.length, 1)
        assertEquals(warnings[0].type, 'loop-iteration-limit-exceeded')
        assertEquals(warnings[0].iterations, 257)
        assert(warnings[0].tokens.length > 0)
    },
)

Deno.test(
    'Count loop emits warning after exceeding 256 iterations',
    async () => {
        const warnings: WarningEvent[] = []

        const session = new YaksokSession({
            stdout: () => {},
            events: {
                warning(warning) {
                    warnings.push(warning)
                },
            },
        })

        session.addModule(
            'main',
            `
257번 반복
    0 보여주기
`,
        )

        await session.runModule('main')

        assertEquals(warnings.length, 1)
        assertEquals(warnings[0].type, 'loop-iteration-limit-exceeded')
        assertEquals(warnings[0].iterations, 257)
        assert(warnings[0].tokens.length > 0)
    },
)

Deno.test(
    'List loop emits warning after exceeding 256 iterations',
    async () => {
        const warnings: WarningEvent[] = []

        const session = new YaksokSession({
            stdout: () => {},
            events: {
                warning(warning) {
                    warnings.push(warning)
                },
            },
        })

        session.addModule(
            'main',
            `
목록 = 0 ~ 260
반복 목록 의 숫자 마다
    숫자 보여주기
`,
        )

        await session.runModule('main')

        assertEquals(warnings.length, 1)
        assertEquals(warnings[0].type, 'loop-iteration-limit-exceeded')
        assertEquals(warnings[0].iterations, 257)
        assert(warnings[0].tokens.length > 0)
    },
)
