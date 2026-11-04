import { test, expect } from 'vite-plus/test'
import { YaksokSession } from '../core/mod.ts'
import { statistics } from '../exts/statistics/mod.ts'

async function runStats(code: string): Promise<string> {
    let output = ''
    let errorOutput = ''

    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
        stderr(value) {
            errorOutput += value + '\n'
        },
    })

    await session.extend(statistics)
    await session.addModule('main', code).run()

    if (errorOutput.trim()) {
        throw new Error(errorOutput.trim())
    }

    return output.trim()
}

// === 합계 ===

test('합계', async () => {
    const output = await runStats(`(@통계 [1, 2, 3, 4, 5]의 합계) 보여주기`)
    expect(output).toBe('15')
})

test('합계 - 총합 표기', async () => {
    const output = await runStats(`(@통계 [10, 20, 30]의 총합) 보여주기`)
    expect(output).toBe('60')
})

test('합계 - 빈 목록', async () => {
    await expect(runStats(`(@통계 []의 합계) 보여주기`)).rejects.toThrow(
        '목록이 비어있습니다',
    )
})

// === 평균 ===

test('평균', async () => {
    const output = await runStats(`(@통계 [2, 4, 6, 8, 10]의 평균) 보여주기`)
    expect(output).toBe('6')
})

test('평균 - 소수점', async () => {
    const output = await runStats(`(@통계 [1, 2, 3]의 평균) 보여주기`)
    expect(output).toBe('2')
})

// === 범위 ===

test('범위', async () => {
    const output = await runStats(`(@통계 [3, 7, 1, 9, 4]의 범위) 보여주기`)
    expect(output).toBe('8')
})

// === 중앙값 ===

test('중앙값 - 홀수 개', async () => {
    const output = await runStats(`(@통계 [1, 3, 5, 7, 9]의 중앙값) 보여주기`)
    expect(output).toBe('5')
})

test('중앙값 - 짝수 개', async () => {
    const output = await runStats(`(@통계 [1, 2, 3, 4]의 중앙값) 보여주기`)
    expect(output).toBe('2.5')
})

test('중앙값 - 정렬되지 않은 데이터', async () => {
    const output = await runStats(`(@통계 [9, 1, 5, 3, 7]의 중앙값) 보여주기`)
    expect(output).toBe('5')
})

// === 최빈값 ===

test('최빈값', async () => {
    const output = await runStats(
        `(@통계 [1, 2, 2, 3, 3, 3, 4]의 최빈값) 보여주기`,
    )
    expect(output).toBe('3')
})

test('최빈값 - 없음', async () => {
    await expect(
        runStats(`(@통계 [1, 2, 3, 4]의 최빈값) 보여주기`),
    ).rejects.toThrow('최빈값이 없습니다')
})

// === 최댓값 ===

test('최댓값', async () => {
    const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최댓값) 보여주기`)
    expect(output).toBe('9')
})

test('최대값 - 다른 표기', async () => {
    const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최대값) 보여주기`)
    expect(output).toBe('9')
})

// === 최솟값 ===

test('최솟값', async () => {
    const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최솟값) 보여주기`)
    expect(output).toBe('1')
})

test('최소값 - 다른 표기', async () => {
    const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최소값) 보여주기`)
    expect(output).toBe('1')
})

// === 분산 ===

test('분산', async () => {
    const output = await runStats(
        `(@통계 [2, 4, 4, 4, 5, 5, 7, 9]의 분산) 보여주기`,
    )
    expect(output).toBe('4')
})

// === 표준편차 ===

test('표준편차', async () => {
    const output = await runStats(
        `(@통계 [2, 4, 4, 4, 5, 5, 7, 9]의 표준편차) 보여주기`,
    )
    expect(output).toBe('2')
})

// === 사분위수 ===

test('사분위수', async () => {
    const output = await runStats(`
데이터 = [1, 2, 3, 4, 5, 6, 7]
결과 = @통계 (데이터)의 사분위수
결과 보여주기
`)
    expect(output).toBe('[2, 4, 6]')
})

// === 왜도 ===

test('왜도 - 대칭 분포', async () => {
    const output = await runStats(`(@통계 [1, 2, 3, 4, 5]의 왜도) 보여주기`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(0, 4)
})

// === 첨도 ===

test('첨도 - 정규분포에 가까운 경우', async () => {
    const output = await runStats(`(@통계 [1, 2, 3, 4, 5]의 첨도) 보여주기`)
    const value = parseFloat(output)
    // 정규분포의 초과 첨도는 0에 가까움
    expect(value).toBeCloseTo(-1.3, 1)
})

// === 공분산 ===

test('공분산 - 양의 상관', async () => {
    const output = await runStats(
        `(@통계 [1, 2, 3, 4, 5]와 [2, 4, 6, 8, 10]의 공분산) 보여주기`,
    )
    expect(output).toBe('4')
})

test('공분산 - 음의 상관', async () => {
    const output = await runStats(
        `(@통계 [1, 2, 3, 4, 5]과 [10, 8, 6, 4, 2]의 공분산) 보여주기`,
    )
    expect(output).toBe('-4')
})

test('공분산 - 길이 불일치', async () => {
    await expect(
        runStats(`(@통계 [1, 2, 3]와 [1, 2]의 공분산) 보여주기`),
    ).rejects.toThrow('두 목록의 길이가 같아야 합니다')
})

// === 상관계수 ===

test('상관계수 - 완전 양의 상관', async () => {
    const output = await runStats(
        `(@통계 [1, 2, 3, 4, 5]와 [2, 4, 6, 8, 10]의 상관계수) 보여주기`,
    )
    const value = parseFloat(output)
    expect(value).toBeCloseTo(1, 4)
})

test('상관계수 - 완전 음의 상관', async () => {
    const output = await runStats(
        `(@통계 [1, 2, 3, 4, 5]과 [10, 8, 6, 4, 2]의 상관계수) 보여주기`,
    )
    const value = parseFloat(output)
    expect(value).toBeCloseTo(-1, 4)
})

// === 변수를 이용한 통계 ===

test('변수를 이용한 통계 연산', async () => {
    const output = await runStats(`
데이터 = [10, 20, 30, 40, 50]
합 = @통계 (데이터)의 합계
평균값 = @통계 (데이터)의 평균
합 보여주기
평균값 보여주기
`)
    expect(output).toBe('150\n30')
})

// === 복합 연산 ===

test('복합 연산 - 표준화', async () => {
    const output = await runStats(`
데이터 = [2, 4, 4, 4, 5, 5, 7, 9]
평균값 = @통계 (데이터)의 평균
표준편차값 = @통계 (데이터)의 표준편차
정규화 = (7 - 평균값) / 표준편차값
정규화 보여주기
`)
    const value = parseFloat(output)
    expect(value).toBeCloseTo(1.0, 4)
})
