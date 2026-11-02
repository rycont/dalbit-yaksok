import { test, expect } from 'vite-plus/test'
import { YaksokSession } from '../core/mod.ts'
import { MathExtension } from '../exts/math/mod.ts'

async function runMath(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })
    await session.extend(new MathExtension())
    await session.addModule('main', code).run()
    return output.trim()
}

test('절댓값', async () => {
    const output = await runMath(`(@수학 (-5)의 절댓값) 보여주기`)
    expect(output).toBe('5')
})

test('절대값 (다른 표기)', async () => {
    const output = await runMath(`(@수학 (-10)의 절대값) 보여주기`)
    expect(output).toBe('10')
})

test('반올림', async () => {
    const output = await runMath(`(@수학 (3.7) 반올림) 보여주기`)
    expect(output).toBe('4')
})

test('반올림 - 내림 케이스', async () => {
    const output = await runMath(`(@수학 (3.2) 반올림) 보여주기`)
    expect(output).toBe('3')
})

test('올림', async () => {
    const output = await runMath(`(@수학 (3.1) 올림) 보여주기`)
    expect(output).toBe('4')
})

test('버림', async () => {
    const output = await runMath(`(@수학 (3.9) 버림) 보여주기`)
    expect(output).toBe('3')
})

test('제곱', async () => {
    const output = await runMath(`(@수학 (5)의 제곱) 보여주기`)
    expect(output).toBe('25')
})

test('제곱근', async () => {
    const output = await runMath(`(@수학 (16)의 제곱근) 보여주기`)
    expect(output).toBe('4')
})

test('거듭제곱', async () => {
    const output = await runMath(`(@수학 (2)의 (10)제곱) 보여주기`)
    expect(output).toBe('1024')
})

test('거듭제곱 - 다른 표기', async () => {
    const output = await runMath(`(@수학 (2)의 (3)거듭제곱) 보여주기`)
    expect(output).toBe('8')
})

test('자연로그', async () => {
    const output = await runMath(`(@수학 (@수학 자연상수)의 자연로그) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(1, 4)
})

test('상용로그', async () => {
    const output = await runMath(`(@수학 (100)의 상용로그) 보여주기`)
    expect(output).toBe('2')
})

test('밑 지정 로그', async () => {
    const output = await runMath(
        `(@수학 (2)를 밑으로 하는 (8)의 로그) 보여주기`,
    )
    expect(output).toBe('3')
})

test('삼각함수 - 사인', async () => {
    const output = await runMath(`(@수학 (0)의 사인) 보여주기`)
    expect(output).toBe('0')
})

test('삼각함수 - 코사인', async () => {
    const output = await runMath(`(@수학 (0)의 코사인) 보여주기`)
    expect(output).toBe('1')
})

test('삼각함수 - 탄젠트', async () => {
    const output = await runMath(`(@수학 (0)의 탄젠트) 보여주기`)
    expect(output).toBe('0')
})

test('아크사인', async () => {
    const output = await runMath(`(@수학 (0)의 아크사인) 보여주기`)
    expect(output).toBe('0')
})

test('아크코사인', async () => {
    const output = await runMath(`(@수학 (1)의 아크코사인) 보여주기`)
    expect(output).toBe('0')
})

test('아크탄젠트', async () => {
    const output = await runMath(`(@수학 (0)의 아크탄젠트) 보여주기`)
    expect(output).toBe('0')
})

test('파이', async () => {
    const output = await runMath(`(@수학 파이) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(Math.PI, 4)
})

test('원주율 (파이 별칭)', async () => {
    const output = await runMath(`(@수학 원주율) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(Math.PI, 4)
})

test('자연상수', async () => {
    const output = await runMath(`(@수학 자연상수) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(Math.E, 4)
})

test('최댓값 - 목록', async () => {
    const output = await runMath(`(@수학 [1, 5, 3, 9, 2]중 최댓값) 보여주기`)
    expect(output).toBe('9')
})

test('최솟값 - 목록', async () => {
    const output = await runMath(`(@수학 [1, 5, 3, 9, 2]에서 최솟값) 보여주기`)
    expect(output).toBe('1')
})

test('최댓값 - 두 값', async () => {
    const output = await runMath(`(@수학 (3)과 (7)중 더 큰 값) 보여주기`)
    expect(output).toBe('7')
})

test('최솟값 - 두 값', async () => {
    const output = await runMath(`(@수학 (3)와 (7)에서 더 작은 수) 보여주기`)
    expect(output).toBe('3')
})

test('랜덤 (0~1)', async () => {
    const output = await runMath(`(@수학 랜덤 값) 보여주기`)
    const value = parseFloat(output)
    expect(value >= 0 && value < 1).toBe(true)
})

test('랜덤 정수', async () => {
    const output = await runMath(`(@수학 (1)부터 (10)까지 랜덤 정수) 보여주기`)
    const value = parseInt(output)
    expect(value >= 1 && value <= 10).toBe(true)
    expect(Number.isInteger(value)).toBe(true)
})

test('나머지', async () => {
    const output = await runMath(`(@수학 (17)을 (5)로 나눈 나머지) 보여주기`)
    expect(output).toBe('2')
})

test('라디안 변환', async () => {
    const output = await runMath(`(@수학 (180) 라디안으로) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(Math.PI, 4)
})

test('각도 변환', async () => {
    const output = await runMath(`(@수학 (@수학 파이) 각도로) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(180, 4)
})

test('합계', async () => {
    const output = await runMath(`(@수학 [1, 2, 3, 4, 5]의 합계) 보여주기`)
    expect(output).toBe('15')
})

test('평균', async () => {
    const output = await runMath(`(@수학 [2, 4, 6, 8, 10]의 평균) 보여주기`)
    expect(output).toBe('6')
})

test('복합 연산 - 피타고라스', async () => {
    const output = await runMath(`
가 = 3
나 = 4
빗변 = @수학 ((@수학 (가)의 제곱) + (@수학 (나)의 제곱))의 제곱근
빗변 보여주기
`)
    expect(output).toBe('5')
})

test('복합 연산 - 원의 넓이', async () => {
    const output = await runMath(`
반지름 = 5
넓이 = (@수학 파이) * (@수학 (반지름)의 제곱)
(@수학 (넓이) 반올림) 보여주기
`)
    expect(output).toBe('79')
})

test('승 표기 - 2의 4승', async () => {
    const output = await runMath(`(@수학 (2)의 (4)승) 보여주기`)
    expect(output).toBe('16')
})

test('승 표기 - 3의 3승', async () => {
    const output = await runMath(`(@수학 (3)의 (3)승) 보여주기`)
    expect(output).toBe('27')
})

test('사인 30도', async () => {
    const output = await runMath(`(@수학 사인 (30)도) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(0.5, 4)
})

test('코사인 60도', async () => {
    const output = await runMath(`(@수학 코사인 (60)도) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(0.5, 4)
})

test('탄젠트 45도', async () => {
    const output = await runMath(`(@수학 탄젠트 (45)도) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(1, 4)
})

test('코사인 0도', async () => {
    const output = await runMath(`(@수학 코사인 (0)도) 보여주기`)
    expect(output).toBe('1')
})

test('사인 90도', async () => {
    const output = await runMath(`(@수학 사인 (90)도) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(1, 4)
})

test('@수학 반올림 - 변수 직접 전달', async () => {
    const output = await runMath(`
평균_손실 = 3.6
(@수학 평균_손실 반올림) 보여주기
`)
    expect(output).toBe('4')
})

test('@수학 반올림 - 변수 괄호 전달', async () => {
    const output = await runMath(`
평균_손실 = 3.6
(@수학 (평균_손실) 반올림) 보여주기
`)
    expect(output).toBe('4')
})

test('소수점 n번째까지 반올림', async () => {
    const output = await runMath(
        `(@수학 (3.153) 소수점 (2)번째까지 반올림) 보여주기`,
    )
    expect(output).toBe('3.15')
})

test('소수점 n자리까지 올림', async () => {
    const output = await runMath(
        `(@수학 (3.731) 소수점 (2)자리까지 올림) 보여주기`,
    )
    expect(output).toBe('3.74')
})

test('소수점 n자리까지 내림', async () => {
    const output = await runMath(
        `(@수학 (3.739) 소수점 (2)자리까지 내림) 보여주기`,
    )
    expect(output).toBe('3.73')
})
