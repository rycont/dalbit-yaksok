import {
    type Extension,
    ExtensionManifest,
    FunctionInvokingParams,
    ListValue,
    NumberValue,
    ValueType,
} from '@dalbit-yaksok/core'

export class MathExtension implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: '수학',
        },
        module: {
            수학: `
번역(수학), (값)의 절댓값/절대값
***
ABS
***

번역(수학), (값) 반올림
***
ROUND
***

번역(수학), (값) 소수점 (숫자)번째까지/자리까지 반올림
***
ROUND_N
***

번역(수학), (값) 올림
***
CEIL
***

번역(수학), (값) 소수점 (숫자)번째까지/자리까지 올림
***
CEIL_N
***

번역(수학), (값) 버림/내림
***
FLOOR
***

번역(수학), (값) 소수점 (숫자)번째까지/자리까지 버림/내림
***
FLOOR_N
***

번역(수학), (값)의 제곱
***
SQUARE
***

번역(수학), (값)의 제곱근
***
SQRT
***

번역(수학), (밑)의 (지수)제곱/거듭제곱/승
***
POWER
***

번역(수학), (값)의 자연로그
***
LOG
***

번역(수학), (값)의 상용로그
***
LOG10
***

번역(수학), (밑)을/를 밑으로 하는 (값)의 로그
***
LOG_BASE
***

번역(수학), (값)의 사인
***
SIN
***

번역(수학), (값)의 코사인
***
COS
***

번역(수학), (값)의 탄젠트
***
TAN
***

번역(수학), 사인 (각도)도
***
SIN_DEG
***

번역(수학), 코사인 (각도)도
***
COS_DEG
***

번역(수학), 탄젠트 (각도)도
***
TAN_DEG
***

번역(수학), (값)의 아크사인
***
ASIN
***

번역(수학), (값)의 아크코사인
***
ACOS
***

번역(수학), (값)의 아크탄젠트
***
ATAN
***

번역(수학), 파이/원주율
***
PI
***

번역(수학), 자연상수
***
E
***

번역(수학), (목록)중/에서 최댓값/최대값
***
MAX
***

번역(수학), (목록)중/에서 최솟값/최소값
***
MIN
***

번역(수학), (가)와/과 (나)중/에서 더 큰 값/수
***
MAX_TWO
***

번역(수학), (가)와/과 (나)중/에서 더 작은 값/수
***
MIN_TWO
***

번역(수학), 랜덤/무작위 값/수
***
RANDOM
***

번역(수학), (최소)부터/이상 (최대)까지/이하/미만 랜덤/무작위 정수
***
RANDOM_INT
***

번역(수학), (가)를/을 (나)로/으로 나눈 나머지
***
MOD
***

번역(수학), (각도) 라디안으로/라디안
***
TO_RADIAN
***

번역(수학), (라디안) 도로/각도로
***
TO_DEGREE
***

번역(수학), (목록)의 합계/총합
***
SUM
***

번역(수학), (목록)의 평균
***
AVERAGE
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
            case 'ABS': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.abs(값.value))
            }
            case 'ROUND': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.round(값.value))
            }
            case 'ROUND_N': {
                const { 값, 숫자 } = args
                this.assertNumber(값)
                this.assertNumber(숫자)
                return new NumberValue(
                    this.roundAt(값.value, 숫자.value, 'round'),
                )
            }
            case 'CEIL': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.ceil(값.value))
            }
            case 'CEIL_N': {
                const { 값, 숫자 } = args
                this.assertNumber(값)
                this.assertNumber(숫자)
                return new NumberValue(
                    this.roundAt(값.value, 숫자.value, 'ceil'),
                )
            }
            case 'FLOOR': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.floor(값.value))
            }
            case 'FLOOR_N': {
                const { 값, 숫자 } = args
                this.assertNumber(값)
                this.assertNumber(숫자)
                return new NumberValue(
                    this.roundAt(값.value, 숫자.value, 'floor'),
                )
            }
            case 'SQUARE': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(값.value ** 2)
            }
            case 'SQRT': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.sqrt(값.value))
            }
            case 'POWER': {
                const { 밑, 지수 } = args
                this.assertNumber(밑)
                this.assertNumber(지수)
                return new NumberValue(Math.pow(밑.value, 지수.value))
            }
            case 'LOG': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.log(값.value))
            }
            case 'LOG10': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.log10(값.value))
            }
            case 'LOG_BASE': {
                const { 밑, 값 } = args
                this.assertNumber(밑)
                this.assertNumber(값)
                return new NumberValue(Math.log(값.value) / Math.log(밑.value))
            }
            case 'SIN': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.sin(값.value))
            }
            case 'COS': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.cos(값.value))
            }
            case 'TAN': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.tan(값.value))
            }
            case 'SIN_DEG': {
                const { 각도 } = args
                this.assertNumber(각도)
                return new NumberValue(Math.sin((각도.value * Math.PI) / 180))
            }
            case 'COS_DEG': {
                const { 각도 } = args
                this.assertNumber(각도)
                return new NumberValue(Math.cos((각도.value * Math.PI) / 180))
            }
            case 'TAN_DEG': {
                const { 각도 } = args
                this.assertNumber(각도)
                return new NumberValue(Math.tan((각도.value * Math.PI) / 180))
            }
            case 'ASIN': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.asin(값.value))
            }
            case 'ACOS': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.acos(값.value))
            }
            case 'ATAN': {
                const { 값 } = args
                this.assertNumber(값)
                return new NumberValue(Math.atan(값.value))
            }
            case 'PI': {
                return new NumberValue(Math.PI)
            }
            case 'E': {
                return new NumberValue(Math.E)
            }
            case 'MAX': {
                const { 목록 } = args
                this.assertListValue(목록)
                const numbers = this.extractNumbers(목록)
                return new NumberValue(Math.max(...numbers))
            }
            case 'MIN': {
                const { 목록 } = args
                this.assertListValue(목록)
                const numbers = this.extractNumbers(목록)
                return new NumberValue(Math.min(...numbers))
            }
            case 'MAX_TWO': {
                const { 가, 나 } = args
                this.assertNumber(가)
                this.assertNumber(나)
                return new NumberValue(Math.max(가.value, 나.value))
            }
            case 'MIN_TWO': {
                const { 가, 나 } = args
                this.assertNumber(가)
                this.assertNumber(나)
                return new NumberValue(Math.min(가.value, 나.value))
            }
            case 'RANDOM': {
                return new NumberValue(Math.random())
            }
            case 'RANDOM_INT': {
                const { 최소, 최대 } = args
                this.assertNumber(최소)
                this.assertNumber(최대)
                const min = Math.ceil(최소.value)
                const max = Math.floor(최대.value)
                return new NumberValue(
                    Math.floor(Math.random() * (max - min + 1)) + min,
                )
            }
            case 'MOD': {
                const { 가, 나 } = args
                this.assertNumber(가)
                this.assertNumber(나)
                return new NumberValue(가.value % 나.value)
            }
            case 'TO_RADIAN': {
                const { 각도 } = args
                this.assertNumber(각도)
                return new NumberValue((각도.value * Math.PI) / 180)
            }
            case 'TO_DEGREE': {
                const { 라디안 } = args
                this.assertNumber(라디안)
                return new NumberValue((라디안.value * 180) / Math.PI)
            }
            case 'SUM': {
                const { 목록 } = args
                this.assertListValue(목록)
                const numbers = this.extractNumbers(목록)
                return new NumberValue(numbers.reduce((a, b) => a + b, 0))
            }
            case 'AVERAGE': {
                const { 목록 } = args
                this.assertListValue(목록)
                const numbers = this.extractNumbers(목록)
                return new NumberValue(
                    numbers.reduce((a, b) => a + b, 0) / numbers.length,
                )
            }
            default:
                throw new Error(`Unknown math action: ${action}`)
        }
    }

    private roundAt(
        value: number,
        digits: number,
        mode: 'round' | 'ceil' | 'floor',
    ): number {
        if (!Number.isInteger(digits) || digits < 0) {
            throw new Error('소수점 자리 수는 0 이상의 정수여야 합니다')
        }

        const factor = 10 ** digits
        if (mode === 'round') {
            return Math.round(value * factor) / factor
        }
        if (mode === 'ceil') {
            return Math.ceil(value * factor) / factor
        }
        return Math.floor(value * factor) / factor
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
            if (!(item instanceof NumberValue)) {
                throw new Error('목록의 모든 항목이 숫자여야 합니다')
            }
            numbers.push(item.value)
        }
        return numbers
    }
}
