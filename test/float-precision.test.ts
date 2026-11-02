import { test, expect } from 'vite-plus/test'
import { cleanFloatingPointError } from '../core/util/float-precision.ts'

test('cleanFloatingPointError - 기본 부동소수점 오류 수정', () => {
    // 0.3 - 0.2 케이스 (실제로 부동소수점 오류가 발생하는 케이스)
    const result1 = 0.3 - 0.2
    expect(cleanFloatingPointError(result1)).toBe(0.1)

    // 0.1 + 0.2 케이스
    const result2 = 0.1 + 0.2
    expect(cleanFloatingPointError(result2)).toBe(0.3)

    // 0.7 - 0.1 케이스
    const result3 = 0.7 - 0.1
    expect(cleanFloatingPointError(result3)).toBe(0.6)
})

test('cleanFloatingPointError - 정수는 그대로', () => {
    expect(cleanFloatingPointError(5)).toBe(5)
    expect(cleanFloatingPointError(-10)).toBe(-10)
    expect(cleanFloatingPointError(0)).toBe(0)
})

test('cleanFloatingPointError - 정상 소수는 유지', () => {
    expect(cleanFloatingPointError(1.5)).toBe(1.5)
    expect(cleanFloatingPointError(3.14159)).toBe(3.14159)
})

test('cleanFloatingPointError - NaN과 Infinity 처리', () => {
    expect(Number.isNaN(cleanFloatingPointError(NaN))).toBe(true)
    expect(cleanFloatingPointError(Infinity)).toBe(Infinity)
    expect(cleanFloatingPointError(-Infinity)).toBe(-Infinity)
})

test('실제 케이스 - 음수 결과', () => {
    const result = 0.1 - 0.2
    expect(cleanFloatingPointError(result)).toBe(-0.1)
})

test('실제 케이스 - 곱셈', () => {
    const result = 0.1 * 0.2
    expect(cleanFloatingPointError(result)).toBe(0.02)
})

test('실제 케이스 - 나눗셈', () => {
    const result = 0.3 / 3
    expect(cleanFloatingPointError(result)).toBe(0.1)
})
