import { assertEquals } from '@std/assert'
import {
    cleanFloatingPointError,
    roundToPrecision,
} from '../core/util/float-precision.ts'

Deno.test('cleanFloatingPointError - 기본 부동소수점 오류 수정', () => {
    // 0.3 - 0.2 케이스 (실제로 부동소수점 오류가 발생하는 케이스)
    const result1 = 0.3 - 0.2
    assertEquals(cleanFloatingPointError(result1), 0.1)

    // 0.1 + 0.2 케이스
    const result2 = 0.1 + 0.2
    assertEquals(cleanFloatingPointError(result2), 0.3)

    // 0.7 - 0.1 케이스
    const result3 = 0.7 - 0.1
    assertEquals(cleanFloatingPointError(result3), 0.6)
})

Deno.test('cleanFloatingPointError - 정수는 그대로', () => {
    assertEquals(cleanFloatingPointError(5), 5)
    assertEquals(cleanFloatingPointError(-10), -10)
    assertEquals(cleanFloatingPointError(0), 0)
})

Deno.test('cleanFloatingPointError - 정상 소수는 유지', () => {
    assertEquals(cleanFloatingPointError(1.5), 1.5)
    assertEquals(cleanFloatingPointError(3.14159), 3.14159)
})

Deno.test('cleanFloatingPointError - NaN과 Infinity 처리', () => {
    assertEquals(Number.isNaN(cleanFloatingPointError(NaN)), true)
    assertEquals(cleanFloatingPointError(Infinity), Infinity)
    assertEquals(cleanFloatingPointError(-Infinity), -Infinity)
})

Deno.test('roundToPrecision - 특정 자리수 반올림', () => {
    const result = 0.2 - 0.1
    assertEquals(roundToPrecision(result, 10), 0.1)
    assertEquals(roundToPrecision(1.23456789012345, 5), 1.23457)
    assertEquals(roundToPrecision(1.23456789012345, 10), 1.2345678901)
    assertEquals(roundToPrecision(1.005, 2), 1.01)
})

Deno.test('실제 케이스 - 음수 결과', () => {
    const result = 0.1 - 0.2
    assertEquals(cleanFloatingPointError(result), -0.1)
})

Deno.test('실제 케이스 - 곱셈', () => {
    const result = 0.1 * 0.2
    assertEquals(cleanFloatingPointError(result), 0.02)
})

Deno.test('실제 케이스 - 나눗셈', () => {
    const result = 0.3 / 3
    assertEquals(cleanFloatingPointError(result), 0.1)
})
