import {
    Extension,
    ListValue,
    NumberValue,
    type ValueType,
} from '@dalbit-yaksok/core'

export const statistics: Extension = {
    capabilties: {
        File: [
            {
                fileName: '통계',
                code: `번역(통계), (목록)의 합계/총합
***
SUM
***

번역(통계), (목록)의 평균
***
MEAN
***

번역(통계), (목록)의 범위
***
RANGE
***

번역(통계), (목록)의 중앙값
***
MEDIAN
***

번역(통계), (목록)의 최빈값
***
MODE
***

번역(통계), (목록)의 최댓값/최대값
***
MAX
***

번역(통계), (목록)의 최솟값/최소값
***
MIN
***

번역(통계), (목록)의 분산
***
VARIANCE
***

번역(통계), (목록)의 표준편차
***
STDDEV
***

번역(통계), (목록)의 사분위수
***
QUARTILES
***

번역(통계), (목록)의 왜도
***
SKEWNESS
***

번역(통계), (목록)의 첨도
***
KURTOSIS
***

번역(통계), (가)와/과 (나)의 공분산
***
COVARIANCE
***

번역(통계), (가)와/과 (나)의 상관계수
***
CORRELATION
***
`,
            },
        ],
        FFI: [
            {
                runtimeId: '통계',
                run(
                    code: string,
                    args: Map<string, ValueType>,
                ): ValueType | Promise<ValueType> {
                    const action = code.trim()

                    switch (action) {
                        case 'SUM':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(sum(numbers)),
                            )
                        case 'MEAN':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(mean(numbers)),
                            )
                        case 'RANGE':
                            return withNumbers(args, (numbers) => {
                                const { min, max } = minMax(numbers)
                                return new NumberValue(max - min)
                            })
                        case 'MEDIAN':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(median(numbers)),
                            )
                        case 'MODE':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(mode(numbers)),
                            )
                        case 'MAX':
                            return withNumbers(
                                args,
                                (numbers) =>
                                    new NumberValue(minMax(numbers).max),
                            )
                        case 'MIN':
                            return withNumbers(
                                args,
                                (numbers) =>
                                    new NumberValue(minMax(numbers).min),
                            )
                        case 'VARIANCE':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(variance(numbers)),
                            )
                        case 'STDDEV':
                            return withNumbers(
                                args,
                                (numbers) =>
                                    new NumberValue(
                                        Math.sqrt(variance(numbers)),
                                    ),
                            )
                        case 'QUARTILES':
                            return withNumbers(args, (numbers) => {
                                const [q1, q2, q3] = quartiles(numbers)
                                return new ListValue([
                                    new NumberValue(q1),
                                    new NumberValue(q2),
                                    new NumberValue(q3),
                                ])
                            })
                        case 'SKEWNESS':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(skewness(numbers)),
                            )
                        case 'KURTOSIS':
                            return withNumbers(
                                args,
                                (numbers) => new NumberValue(kurtosis(numbers)),
                            )
                        case 'COVARIANCE':
                            return withTwoNumberLists(
                                args,
                                (numbersA, numbersB) =>
                                    new NumberValue(
                                        covariance(numbersA, numbersB),
                                    ),
                            )
                        case 'CORRELATION':
                            return withTwoNumberLists(
                                args,
                                (numbersA, numbersB) =>
                                    new NumberValue(
                                        correlation(numbersA, numbersB),
                                    ),
                            )
                        default:
                            throw new Error(
                                `알 수 없는 통계 연산입니다: ${action}`,
                            )
                    }
                },
            },
        ],
    },
}

function assertNumber(value: ValueType): asserts value is NumberValue {
    if (!(value instanceof NumberValue)) {
        throw new Error('숫자가 필요합니다')
    }
}

function assertListValue(value?: ValueType): asserts value is ListValue {
    if (!(value instanceof ListValue)) {
        throw new Error('목록이 필요합니다')
    }
}

function extractNumbers(list: ListValue): number[] {
    const numbers: number[] = []
    for (const item of list.enumerate()) {
        assertNumber(item)
        numbers.push(item.value)
    }

    if (numbers.length === 0) {
        throw new Error('목록이 비어있습니다')
    }

    return numbers
}

function withNumbers(
    args: Map<string, ValueType>,
    callback: (numbers: number[]) => ValueType,
): ValueType {
    const 목록 = args.get('목록')
    assertListValue(목록)
    const numbers = extractNumbers(목록)
    return callback(numbers)
}

function withTwoNumberLists(
    args: Map<string, ValueType>,
    callback: (numbersA: number[], numbersB: number[]) => ValueType,
): ValueType {
    const 가 = args.get('가')
    const 나 = args.get('나')
    assertListValue(가)
    assertListValue(나)
    const numbersA = extractNumbers(가)
    const numbersB = extractNumbers(나)
    return callback(numbersA, numbersB)
}

function sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0)
}

function mean(numbers: number[]): number {
    return sum(numbers) / numbers.length
}

function median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const n = sorted.length
    const mid = Math.floor(n / 2)

    if (n % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2
    }

    return sorted[mid]
}

function mode(numbers: number[]): number {
    const frequency = new Map<number, number>()

    for (const num of numbers) {
        frequency.set(num, (frequency.get(num) ?? 0) + 1)
    }

    let maxFreq = 0
    let modeValue = numbers[0]

    for (const [num, freq] of frequency) {
        if (freq > maxFreq) {
            maxFreq = freq
            modeValue = num
        }
    }

    if (maxFreq <= 1) {
        throw new Error('최빈값이 없습니다')
    }

    return modeValue
}

function minMax(numbers: number[]): { min: number; max: number } {
    let min = numbers[0]
    let max = numbers[0]

    for (let i = 1; i < numbers.length; i++) {
        const value = numbers[i]
        if (value < min) {
            min = value
        }
        if (value > max) {
            max = value
        }
    }

    return { min, max }
}

function variance(numbers: number[]): number {
    const avg = mean(numbers)
    const squaredDiffs = numbers.map((x) => (x - avg) ** 2)
    return sum(squaredDiffs) / numbers.length
}

function quartiles(numbers: number[]): [number, number, number] {
    const sorted = [...numbers].sort((a, b) => a - b)
    const n = sorted.length

    const q2 = median(sorted)

    const lowerHalf =
        n % 2 === 0
            ? sorted.slice(0, n / 2)
            : sorted.slice(0, Math.floor(n / 2))

    const upperHalf =
        n % 2 === 0 ? sorted.slice(n / 2) : sorted.slice(Math.floor(n / 2) + 1)

    const q1 = median(lowerHalf)
    const q3 = median(upperHalf)

    return [q1, q2, q3]
}

function skewness(numbers: number[]): number {
    const n = numbers.length
    const avg = mean(numbers)
    const stddev = Math.sqrt(variance(numbers))

    if (stddev === 0) {
        return 0
    }

    const cubedDiffs = numbers.map((x) => ((x - avg) / stddev) ** 3)
    return sum(cubedDiffs) / n
}

function kurtosis(numbers: number[]): number {
    const n = numbers.length
    const avg = mean(numbers)
    const stddev = Math.sqrt(variance(numbers))

    if (stddev === 0) {
        return 0
    }

    const fourthDiffs = numbers.map((x) => ((x - avg) / stddev) ** 4)
    return sum(fourthDiffs) / n - 3
}

function covariance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('두 목록의 길이가 같아야 합니다')
    }

    const meanA = mean(a)
    const meanB = mean(b)
    const n = a.length

    let cov = 0
    for (let i = 0; i < n; i++) {
        cov += (a[i] - meanA) * (b[i] - meanB)
    }

    return cov / n
}

function correlation(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('두 목록의 길이가 같아야 합니다')
    }

    const cov = covariance(a, b)
    const stddevA = Math.sqrt(variance(a))
    const stddevB = Math.sqrt(variance(b))

    if (stddevA === 0 || stddevB === 0) {
        return 0
    }

    return cov / (stddevA * stddevB)
}
