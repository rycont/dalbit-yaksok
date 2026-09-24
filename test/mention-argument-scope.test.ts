import { assert, assertEquals, assertInstanceOf } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import {
    MissingRequiredArgumentError,
    TooManyArgumentsError,
    UnexpectedArgumentError,
} from '../core/error/function.ts'
import type { YaksokError } from '../core/error/common.ts'

const 모듈 = `약속, 이동하기(가로, 세로)
    "{가로},{세로}" 보여주기

약속, 설정하기(밝기, 소리?)
    소리 보여주기
`

async function run(code: string) {
    const printed: string[] = []
    const session = new YaksokSession({
        stdout: (message: string) => printed.push(message),
        stderr() {},
    })

    await session.addModule('장치', 모듈).run()
    const codeFile = session.addModule('main', code)

    return { codeFile, printed }
}

async function validationErrors(code: string): Promise<YaksokError[]> {
    const { codeFile } = await run(code)

    return codeFile.prepareErrors
}

Deno.test('인자는 호출한 쪽 스코프에서 평가된다', async (t) => {
    await t.step('블록 호출', async () => {
        const { codeFile, printed } = await run(
            `값 = 9\n@장치 이동하기\n    가로: 값\n    세로: 2`,
        )
        await codeFile.run()
        assertEquals(printed, ['9,2'])
    })

    await t.step('괄호 호출', async () => {
        const { codeFile, printed } = await run(`값 = 9\n@장치 이동하기(값, 2)`)
        await codeFile.run()
        assertEquals(printed, ['9,2'])
    })

    await t.step('수식도 호출한 쪽에서 평가된다', async () => {
        const { codeFile, printed } = await run(
            `값 = 9\n@장치 이동하기\n    가로: 값 + 1\n    세로: 2`,
        )
        await codeFile.run()
        assertEquals(printed, ['10,2'])
    })

    await t.step('없는 변수는 여전히 오류다', async () => {
        const errors = await validationErrors(
            `@장치 이동하기\n    가로: 없는변수\n    세로: 2`,
        )
        assert(errors.length > 0, '정의되지 않은 변수를 잡아야 해요')
    })
})

Deno.test('모듈 너머의 약속도 인자 검사를 받는다', async (t) => {
    await t.step('필수 인자 누락', async () => {
        const errors = await validationErrors(`@장치 이동하기\n    가로: 1`)
        assertInstanceOf(errors[0], MissingRequiredArgumentError)
    })

    await t.step('모르는 이름', async () => {
        const errors = await validationErrors(
            `@장치 이동하기\n    가로: 1\n    세로: 2\n    높이: 3`,
        )
        assertInstanceOf(errors[0], UnexpectedArgumentError)
    })

    await t.step('인자 초과', async () => {
        const errors = await validationErrors(`@장치 이동하기(1, 2, 3)`)
        assertInstanceOf(errors[0], TooManyArgumentsError)
    })

    await t.step('선택 인자는 생략해도 된다', async () => {
        const { codeFile, printed } = await run(`@장치 설정하기(1)`)
        await codeFile.run()
        assertEquals(printed, ['비어있음'])
    })
})
