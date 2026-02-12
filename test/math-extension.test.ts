import { assertEquals, assertAlmostEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { MathExtension } from '../math/mod.ts'

async function runMath(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })
    await session.extend(new MathExtension())
    session.addModule('main', code)
    await session.runModule('main')
    return output.trim()
}

Deno.test('절댓값', async () => {
    const output = await runMath(`(@수학 (-5)의 절댓값) 보여주기`)
    assertEquals(output, '5')
})

Deno.test('절대값 (다른 표기)', async () => {
    const output = await runMath(`(@수학 (-10)의 절대값) 보여주기`)
    assertEquals(output, '10')
})

Deno.test('반올림', async () => {
    const output = await runMath(`(@수학 (3.7) 반올림) 보여주기`)
    assertEquals(output, '4')
})

Deno.test('반올림 - 내림 케이스', async () => {
    const output = await runMath(`(@수학 (3.2) 반올림) 보여주기`)
    assertEquals(output, '3')
})

Deno.test('올림', async () => {
    const output = await runMath(`(@수학 (3.1) 올림) 보여주기`)
    assertEquals(output, '4')
})

Deno.test('버림', async () => {
    const output = await runMath(`(@수학 (3.9) 버림) 보여주기`)
    assertEquals(output, '3')
})

Deno.test('제곱', async () => {
    const output = await runMath(`(@수학 (5)의 제곱) 보여주기`)
    assertEquals(output, '25')
})

Deno.test('제곱근', async () => {
    const output = await runMath(`(@수학 (16)의 제곱근) 보여주기`)
    assertEquals(output, '4')
})

Deno.test('거듭제곱', async () => {
    const output = await runMath(`(@수학 (2)의 (10)제곱) 보여주기`)
    assertEquals(output, '1024')
})

Deno.test('거듭제곱 - 다른 표기', async () => {
    const output = await runMath(`(@수학 (2)의 (3)거듭제곱) 보여주기`)
    assertEquals(output, '8')
})

Deno.test('자연로그', async () => {
    const output = await runMath(`(@수학 (@수학 자연상수)의 자연로그) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 1, 0.0001)
})

Deno.test('상용로그', async () => {
    const output = await runMath(`(@수학 (100)의 상용로그) 보여주기`)
    assertEquals(output, '2')
})

Deno.test('밑 지정 로그', async () => {
    const output = await runMath(`(@수학 (2)를 밑으로 하는 (8)의 로그) 보여주기`)
    assertEquals(output, '3')
})

Deno.test('삼각함수 - 사인', async () => {
    const output = await runMath(`(@수학 (0)의 사인) 보여주기`)
    assertEquals(output, '0')
})

Deno.test('삼각함수 - 코사인', async () => {
    const output = await runMath(`(@수학 (0)의 코사인) 보여주기`)
    assertEquals(output, '1')
})

Deno.test('삼각함수 - 탄젠트', async () => {
    const output = await runMath(`(@수학 (0)의 탄젠트) 보여주기`)
    assertEquals(output, '0')
})

Deno.test('아크사인', async () => {
    const output = await runMath(`(@수학 (0)의 아크사인) 보여주기`)
    assertEquals(output, '0')
})

Deno.test('아크코사인', async () => {
    const output = await runMath(`(@수학 (1)의 아크코사인) 보여주기`)
    assertEquals(output, '0')
})

Deno.test('아크탄젠트', async () => {
    const output = await runMath(`(@수학 (0)의 아크탄젠트) 보여주기`)
    assertEquals(output, '0')
})

Deno.test('파이', async () => {
    const output = await runMath(`(@수학 파이) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, Math.PI, 0.0001)
})

Deno.test('원주율 (파이 별칭)', async () => {
    const output = await runMath(`(@수학 원주율) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, Math.PI, 0.0001)
})

Deno.test('자연상수', async () => {
    const output = await runMath(`(@수학 자연상수) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, Math.E, 0.0001)
})

Deno.test('최댓값 - 목록', async () => {
    const output = await runMath(`(@수학 [1, 5, 3, 9, 2]중 최댓값) 보여주기`)
    assertEquals(output, '9')
})

Deno.test('최솟값 - 목록', async () => {
    const output = await runMath(`(@수학 [1, 5, 3, 9, 2]에서 최솟값) 보여주기`)
    assertEquals(output, '1')
})

Deno.test('최댓값 - 두 값', async () => {
    const output = await runMath(`(@수학 (3)과 (7)중 더 큰 값) 보여주기`)
    assertEquals(output, '7')
})

Deno.test('최솟값 - 두 값', async () => {
    const output = await runMath(`(@수학 (3)와 (7)에서 더 작은 수) 보여주기`)
    assertEquals(output, '3')
})

Deno.test('랜덤 (0~1)', async () => {
    const output = await runMath(`(@수학 랜덤 값) 보여주기`)
    const value = parseFloat(output)
    assertEquals(value >= 0 && value < 1, true)
})

Deno.test('랜덤 정수', async () => {
    const output = await runMath(`(@수학 (1)부터 (10)까지 랜덤 정수) 보여주기`)
    const value = parseInt(output)
    assertEquals(value >= 1 && value <= 10, true)
    assertEquals(Number.isInteger(value), true)
})

Deno.test('나머지', async () => {
    const output = await runMath(`(@수학 (17)을 (5)로 나눈 나머지) 보여주기`)
    assertEquals(output, '2')
})

Deno.test('라디안 변환', async () => {
    const output = await runMath(`(@수학 (180) 라디안으로) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, Math.PI, 0.0001)
})

Deno.test('각도 변환', async () => {
    const output = await runMath(`(@수학 (@수학 파이) 각도로) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 180, 0.0001)
})

Deno.test('합계', async () => {
    const output = await runMath(`(@수학 [1, 2, 3, 4, 5]의 합계) 보여주기`)
    assertEquals(output, '15')
})

Deno.test('평균', async () => {
    const output = await runMath(`(@수학 [2, 4, 6, 8, 10]의 평균) 보여주기`)
    assertEquals(output, '6')
})

Deno.test('복합 연산 - 피타고라스', async () => {
    const output = await runMath(`
가 = 3
나 = 4
빗변 = @수학 ((@수학 (가)의 제곱) + (@수학 (나)의 제곱))의 제곱근
빗변 보여주기
`)
    assertEquals(output, '5')
})

Deno.test('복합 연산 - 원의 넓이', async () => {
    const output = await runMath(`
반지름 = 5
넓이 = (@수학 파이) * (@수학 (반지름)의 제곱)
(@수학 (넓이) 반올림) 보여주기
`)
    assertEquals(output, '79')
})

Deno.test('승 표기 - 2의 4승', async () => {
    const output = await runMath(`(@수학 (2)의 (4)승) 보여주기`)
    assertEquals(output, '16')
})

Deno.test('승 표기 - 3의 3승', async () => {
    const output = await runMath(`(@수학 (3)의 (3)승) 보여주기`)
    assertEquals(output, '27')
})

Deno.test('사인 30도', async () => {
    const output = await runMath(`(@수학 사인 (30)도) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 0.5, 0.0001)
})

Deno.test('코사인 60도', async () => {
    const output = await runMath(`(@수학 코사인 (60)도) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 0.5, 0.0001)
})

Deno.test('탄젠트 45도', async () => {
    const output = await runMath(`(@수학 탄젠트 (45)도) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 1, 0.0001)
})

Deno.test('코사인 0도', async () => {
    const output = await runMath(`(@수학 코사인 (0)도) 보여주기`)
    assertEquals(output, '1')
})

Deno.test('사인 90도', async () => {
    const output = await runMath(`(@수학 사인 (90)도) 보여주기`)
    const value = parseFloat(output)
    assertAlmostEquals(value, 1, 0.0001)
})
