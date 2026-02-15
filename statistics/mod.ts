import {
    type Extension,
    type ExtensionManifest,
    type FunctionInvokingParams,
    ListValue,
    NumberValue,
    type ValueType,
} from '@dalbit-yaksok/core'

export class StatisticsExtension implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: '통계',
        },
        module: {
            통계: `
번역(통계), (목록)의 합계/총합
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
    }

    executeFFI(
        code: string,
        args: FunctionInvokingParams,
    ): ValueType | Promise<ValueType> {
        const action = code.trim()

        switch (action) {
            case 'SUM':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.sum(numbers)),
                )
            case 'MEAN':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.mean(numbers)),
                )
            case 'RANGE':
                return this.withNumbers(args, (numbers) => {
                    const { min, max } = this.minMax(numbers)
                    return new NumberValue(max - min)
                })
            case 'MEDIAN':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.median(numbers)),
                )
            case 'MODE':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.mode(numbers)),
                )
            case 'MAX':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.minMax(numbers).max),
                )
            case 'MIN':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.minMax(numbers).min),
                )
            case 'VARIANCE':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.variance(numbers)),
                )
            case 'STDDEV':
                return this.withNumbers(
                    args,
                    (numbers) =>
                        new NumberValue(Math.sqrt(this.variance(numbers))),
                )
            case 'QUARTILES':
                return this.withNumbers(args, (numbers) => {
                    const [q1, q2, q3] = this.quartiles(numbers)
                    return new ListValue([
                        new NumberValue(q1),
                        new NumberValue(q2),
                        new NumberValue(q3),
                    ])
                })
            case 'SKEWNESS':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.skewness(numbers)),
                )
            case 'KURTOSIS':
                return this.withNumbers(
                    args,
                    (numbers) => new NumberValue(this.kurtosis(numbers)),
                )
            case 'COVARIANCE':
                return this.withTwoNumberLists(
                    args,
                    (numbersA, numbersB) =>
                        new NumberValue(this.covariance(numbersA, numbersB)),
                )
            case 'CORRELATION':
                return this.withTwoNumberLists(
                    args,
                    (numbersA, numbersB) =>
                        new NumberValue(this.correlation(numbersA, numbersB)),
                )
            default:
                throw new Error(`알 수 없는 통계 연산입니다: ${action}`)
        }
    }

    private assertNumber(value: ValueType): asserts value is NumberValue {
        if (!(value instanceof NumberValue)) {
            throw new Error('숫자가 필요합니다')
        }
    }

    private assertListValue(value: ValueType): asserts value is ListValue {
        if (!(value instanceof ListValue)) {
            throw new Error('목록이 필요합니다')
        }
    }

    private extractNumbers(list: ListValue): number[] {
        const numbers: number[] = []
        for (const item of list.enumerate()) {
            this.assertNumber(item)
            numbers.push(item.value)
        }

        if (numbers.length === 0) {
            throw new Error('목록이 비어있습니다')
        }

        return numbers
    }

    private withNumbers(
        args: FunctionInvokingParams,
        callback: (numbers: number[]) => ValueType,
    ): ValueType {
        const { 목록 } = args
        this.assertListValue(목록)
        const numbers = this.extractNumbers(목록)
        return callback(numbers)
    }

    private withTwoNumberLists(
        args: FunctionInvokingParams,
        callback: (numbersA: number[], numbersB: number[]) => ValueType,
    ): ValueType {
        const { 가, 나 } = args
        this.assertListValue(가)
        this.assertListValue(나)
        const numbersA = this.extractNumbers(가)
        const numbersB = this.extractNumbers(나)
        return callback(numbersA, numbersB)
    }

    private sum(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0)
    }

    private mean(numbers: number[]): number {
        return this.sum(numbers) / numbers.length
    }

    private median(numbers: number[]): number {
        const sorted = [...numbers].sort((a, b) => a - b)
        const n = sorted.length
        const mid = Math.floor(n / 2)

        if (n % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2
        }

        return sorted[mid]
    }

    private mode(numbers: number[]): number {
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

    private minMax(numbers: number[]): { min: number; max: number } {
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

    private variance(numbers: number[]): number {
        const avg = this.mean(numbers)
        const squaredDiffs = numbers.map((x) => (x - avg) ** 2)
        return this.sum(squaredDiffs) / numbers.length
    }

    private quartiles(numbers: number[]): [number, number, number] {
        const sorted = [...numbers].sort((a, b) => a - b)
        const n = sorted.length

        const q2 = this.median(sorted)

        const lowerHalf =
            n % 2 === 0
                ? sorted.slice(0, n / 2)
                : sorted.slice(0, Math.floor(n / 2))

        const upperHalf =
            n % 2 === 0
                ? sorted.slice(n / 2)
                : sorted.slice(Math.floor(n / 2) + 1)

        const q1 = this.median(lowerHalf)
        const q3 = this.median(upperHalf)

        return [q1, q2, q3]
    }

    private skewness(numbers: number[]): number {
        const n = numbers.length
        const avg = this.mean(numbers)
        const stddev = Math.sqrt(this.variance(numbers))

        if (stddev === 0) {
            return 0
        }

        const cubedDiffs = numbers.map((x) => ((x - avg) / stddev) ** 3)
        return this.sum(cubedDiffs) / n
    }

    private kurtosis(numbers: number[]): number {
        const n = numbers.length
        const avg = this.mean(numbers)
        const stddev = Math.sqrt(this.variance(numbers))

        if (stddev === 0) {
            return 0
        }

        const fourthDiffs = numbers.map((x) => ((x - avg) / stddev) ** 4)
        return this.sum(fourthDiffs) / n - 3
    }

    private covariance(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('두 목록의 길이가 같아야 합니다')
        }

        const meanA = this.mean(a)
        const meanB = this.mean(b)
        const n = a.length

        let cov = 0
        for (let i = 0; i < n; i++) {
            cov += (a[i] - meanA) * (b[i] - meanB)
        }

        return cov / n
    }

    private correlation(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('두 목록의 길이가 같아야 합니다')
        }

        const cov = this.covariance(a, b)
        const stddevA = Math.sqrt(this.variance(a))
        const stddevB = Math.sqrt(this.variance(b))

        if (stddevA === 0 || stddevB === 0) {
            return 0
        }

        return cov / (stddevA * stddevB)
    }
}
