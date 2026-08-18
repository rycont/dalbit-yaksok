import { assert, assertInstanceOf } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'
import {
    MissingRequiredArgumentError,
    RequiredParametersShouldPriorError,
    TooManyArgumentsError,
    UnexpectedArgumentError,
} from '../../core/error/function.ts'
import type { YaksokError } from '../../core/error/common.ts'

async function validationErrors(code: string): Promise<YaksokError[]> {
    const session = new YaksokSession({ stderr() {} })
    session.addModule('main', code)

    const result = (await session.runModule('main')).get('main')!
    assert(
        result.reason === 'validation',
        `검증 오류를 기대했지만 "${result.reason}"이 나왔어요`,
    )

    return [...result.errors.values()].flat()
}

const 이동하기 = `약속, 이동하기(가로, 세로)\n    가로 보여주기\n\n`
const 선택_포함 = `약속, 이동하기(가로, 세로?)\n    가로 보여주기\n\n`

Deno.test('필수 인자가 빠지면 이름을 알려준다', async (t) => {
    await t.step('괄호 호출', async () => {
        const errors = await validationErrors(이동하기 + `이동하기(1)`)
        assertInstanceOf(errors[0], MissingRequiredArgumentError)
    })

    await t.step('블록 호출', async () => {
        const errors = await validationErrors(
            이동하기 + `이동하기\n    가로: 1`,
        )
        assertInstanceOf(errors[0], MissingRequiredArgumentError)
    })

    await t.step('여러 개가 빠지면 모두 보고한다', async () => {
        const errors = await validationErrors(
            `약속, 이동하기(가로, 세로, 높이)\n    가로 보여주기\n\n이동하기(1)`,
        )
        const error = errors[0]
        assertInstanceOf(error, MissingRequiredArgumentError)
        assert(
            error.message.includes('세로') && error.message.includes('높이'),
            `빠진 이름이 모두 나와야 해요: ${error.message}`,
        )
    })
})

Deno.test('선택 인자는 빠져도 오류가 아니다', async () => {
    const session = new YaksokSession({ stderr() {} })
    session.addModule('main', 선택_포함 + `이동하기(1)`)

    const result = (await session.runModule('main')).get('main')!
    assert(result.reason === 'finish', `실행이 끝나야 해요: ${result.reason}`)
})

Deno.test('인자를 너무 많이 주면 오류가 난다', async (t) => {
    await t.step('필수만 있는 약속', async () => {
        const errors = await validationErrors(이동하기 + `이동하기(1, 2, 3)`)
        assertInstanceOf(errors[0], TooManyArgumentsError)
    })

    await t.step('선택 인자도 상한에 포함된다', async () => {
        const errors = await validationErrors(선택_포함 + `이동하기(1, 2, 3)`)
        assertInstanceOf(errors[0], TooManyArgumentsError)
    })
})

Deno.test('블록 호출에 모르는 이름을 주면 오류가 난다', async () => {
    const errors = await validationErrors(
        이동하기 + `이동하기\n    가로: 1\n    세로: 2\n    높이: 3`,
    )
    assertInstanceOf(errors[0], UnexpectedArgumentError)
})

Deno.test('이름을 잘못 적으면 누락과 모르는 이름이 함께 나온다', async () => {
    const errors = await validationErrors(
        이동하기 + `이동하기\n    가로: 1\n    세루: 2`,
    )

    assert(
        errors.some((e) => e instanceof MissingRequiredArgumentError),
        '빠진 이름을 알려줘야 해요',
    )
    assert(
        errors.some((e) => e instanceof UnexpectedArgumentError),
        '모르는 이름을 알려줘야 해요',
    )
})

Deno.test('선택 인자는 필수 인자보다 앞에 올 수 없다', async (t) => {
    await t.step('맨 앞이 선택', async () => {
        const errors = await validationErrors(
            `약속, 이동하기(가로?, 세로)\n    세로 보여주기\n\n이동하기\n    세로: 2`,
        )
        assertInstanceOf(errors[0], RequiredParametersShouldPriorError)
    })

    await t.step('가운데가 선택', async () => {
        const errors = await validationErrors(
            `약속, 이동하기(가로, 세로?, 높이)\n    높이 보여주기\n\n이동하기\n    가로: 1\n    높이: 3`,
        )
        assertInstanceOf(errors[0], RequiredParametersShouldPriorError)
    })
})
