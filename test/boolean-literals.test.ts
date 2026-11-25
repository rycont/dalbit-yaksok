import { BooleanValue, YaksokSession } from '@dalbit-yaksok/core'
import { test, expect, assert } from 'vite-plus/test'

const TRUE_LITERALS = ['참', '맞음']
const FALSE_LITERALS = ['거짓', '아님']

for (const literal of TRUE_LITERALS) {
    test(literal, async () => {
        const session = new YaksokSession()
        const frame = await session
            .addModule(
                'main',
                `
결과 = ${literal}
`,
            )
            .run()
        const result = frame.get(
            frame.scope.findSlot('결과')[0]!,
        ) as BooleanValue
        expect(result.value).toBe(true)
    })
}

for (const literal of FALSE_LITERALS) {
    test(literal, async () => {
        const session = new YaksokSession()
        const frame = await session
            .addModule(
                'main',
                `
결과 = ${literal}
`,
            )
            .run()
        const result = frame.get(
            frame.scope.findSlot('결과')[0]!,
        ) as BooleanValue
        expect(result.value).toBe(false)
    })
}

test('Store boolean in variable', async () => {
    const session = new YaksokSession()
    const frame = await session
        .addModule(
            'main',
            `
불리언 = 참
결과 = 불리언
`,
        )
        .run()
    const result = frame.get(frame.scope.findSlot('결과')[0]!) as BooleanValue
    expect(result.value).toBe(true)
})

test('Compare booleans', async () => {
    const session = new YaksokSession()
    const frame = await session
        .addModule(
            'main',
            `
결과1 = 참 == 참
결과2 = 거짓 == 거짓
결과3 = 참 == 거짓
결과4 = 참 != 거짓
`,
        )
        .run()

    assert(frame)

    expect(
        (frame.get(frame.scope.findSlot('결과1')[0]!) as BooleanValue).value,
    ).toBe(true)
    expect(
        (frame.get(frame.scope.findSlot('결과2')[0]!) as BooleanValue).value,
    ).toBe(true)
    expect(
        (frame.get(frame.scope.findSlot('결과3')[0]!) as BooleanValue).value,
    ).toBe(false)
    expect(
        (frame.get(frame.scope.findSlot('결과4')[0]!) as BooleanValue).value,
    ).toBe(true)
})

test('Negation operator', async () => {
    const session = new YaksokSession()
    const frame = await session
        .addModule(
            'main',
            `
결과1 = 참 아니다
결과2 = 거짓 아니다
결과3 = 1 == 1 아니다
불리언 = 참
결과4 = 불리언 아니다
`,
        )
        .run()

    assert(frame)

    expect(
        (frame.get(frame.scope.findSlot('결과1')[0]!) as BooleanValue).value,
    ).toBe(false)
    expect(
        (frame.get(frame.scope.findSlot('결과2')[0]!) as BooleanValue).value,
    ).toBe(true)
    expect(
        (frame.get(frame.scope.findSlot('결과3')[0]!) as BooleanValue).value,
    ).toBe(false)
    expect(
        (frame.get(frame.scope.findSlot('결과4')[0]!) as BooleanValue).value,
    ).toBe(false)
})
