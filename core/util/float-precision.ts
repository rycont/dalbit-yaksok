/**
 * 부동소수점 연산 결과를 정리하는 유틸리티 함수
 */

/**
 * 부동소수점 연산 결과에서 아주 작은 오차를 정리합니다.
 * 예: -0.09999999999999998 → -0.1
 * 
 * 방식: 소수점 14자리(JavaScript의 안전 정밀도 범위)에서 반올림
 */
export function cleanFloatingPointError(value: number): number {
    // NaN, Infinity 체크
    if (!Number.isFinite(value)) {
        return value
    }

    // 정수는 그대로 반환
    if (Number.isInteger(value)) {
        return value
    }

    // 소수점 14자리에서 반올림 (JavaScript 안전 정밀도)
    // 이렇게 하면 0.09999999999999998 같은 값이 0.1로 정리됨
    return parseFloat(value.toPrecision(15))
}

/**
 * 더 강력한 정리: 소수점 특정 자리에서 반올림
 * @param value 정리할 숫자
 * @param precision 소수점 자리수 (기본: 10)
 */
export function roundToPrecision(value: number, precision: number = 10): number {
    if (!Number.isFinite(value)) {
        return value
    }

    return Number(`${Math.round(Number(`${value}e${precision}`))}e-${precision}`)
}
