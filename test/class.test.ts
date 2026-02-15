import { assertEquals } from 'https://deno.land/std@0.201.0/testing/asserts.ts'
import { YaksokSession } from '../core/mod.ts'

Deno.test('클래스 선언 및 인스턴스 생성', async () => {
    const code = `
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
        자신.나이 = 10

    약속, (음료) 마시기
        자신.이름 + "(이)가 " + 음료 + " 마심" 반환하기

나 = 새 사람("정한")
나.나이 보여주기
나. "물" 마시기 보여주기
`
    const outputs: string[] = []
    const session = new YaksokSession({
        stdout: (msg: string) => {
            outputs.push(msg)
        },
    })

    session.addModule('main', code)
    const results = await session.runModule('main')
    const result = results.get('main')!
    if (result.reason === 'error') throw result.error
    if (result.reason === 'validation') {
        const errMsgs: string[] = []
        for (const [key, errs] of result.errors) {
            errMsgs.push(`${key}: ${errs.map((e) => e.message).join(', ')}`)
        }
        throw new Error('Validation failed: ' + errMsgs.join('; '))
    }

    assertEquals(outputs[0], '10')
    assertEquals(outputs[1], '정한(이)가 물 마심')
})

Deno.test('클래스 멤버 변수 수정', async () => {
    const code = `
클래스, 카운터
    값 = 0
    약속, 증가
        자신.값 = 자신.값 + 1

c = 새 카운터
c.값 보여주기
c. 증가
c.값 보여주기
`
    const outputs: string[] = []
    const session = new YaksokSession({
        stdout: (msg: string) => outputs.push(msg),
    })
    session.addModule('main', code)
    const results = await session.runModule('main')
    const result = results.get('main')!
    if (result.reason === 'error') throw result.error
    if (result.reason === 'validation') {
        const errMsgs: string[] = []
        for (const [key, errs] of result.errors) {
            errMsgs.push(`${key}: ${errs.map((e) => e.message).join(', ')}`)
        }
        throw new Error('Validation failed: ' + errMsgs.join('; '))
    }

    assertEquals(outputs[0], '0')
    assertEquals(outputs[1], '1')
})
