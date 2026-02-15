import {
    type Extension,
    ExtensionManifest,
    NumberValue,
    ListValue,
    StringValue,
    ValueType,
    FunctionInvokingParams,
} from '@dalbit-yaksok/core'

export class StandardExtension implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: '표준',
        },
        module: {
            표준: `
메소드(문자, 리스트), 번역(표준), 길이
***
LENGTH
***

메소드(리스트), 번역(표준), 합계
***
SUM
***

메소드(리스트), 번역(표준), 모든곱
***
PRODUCT
***

메소드(문자), 번역(표준), (구분자)로 자르기
***
SPLIT
***

메소드(리스트), 번역(표준), (구분자)로 합치기
***
JOIN
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
            case 'LENGTH': {
                const { 자신 } = args
                if (자신 instanceof StringValue) {
                    return new NumberValue(자신.value.length)
                }
                if (자신 instanceof ListValue) {
                    const length = Array.from(자신.enumerate()).length
                    return new NumberValue(length)
                }
                throw new Error('길이를 구할 수 없는 대상이에요.')
            }
            case 'SUM': {
                const { 자신 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('합계를 구할 수 없는 대상이에요.')
                }
                const sum = Array.from(자신.enumerate()).reduce((acc, curr) => {
                    if (!(curr instanceof NumberValue)) {
                        throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                    }
                    return acc + curr.value
                }, 0)
                return new NumberValue(sum)
            }
            case 'PRODUCT': {
                const { 자신 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('곱을 구할 수 없는 대상이에요.')
                }
                const product = Array.from(자신.enumerate()).reduce((acc, curr) => {
                    if (!(curr instanceof NumberValue)) {
                        throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                    }
                    return acc * curr.value
                }, 1)
                return new NumberValue(product)
            }
            case 'SPLIT': {
                const { 자신, 구분자 } = args
                if (!(자신 instanceof StringValue)) {
                    throw new Error('문자열이 아니면 자를 수 없어요.')
                }
                if (!(구분자 instanceof StringValue)) {
                    throw new Error('구분자는 문자열이어야 해요.')
                }
                const parts = 자신.value.split(구분자.value)
                return new ListValue(parts.map(p => new StringValue(p)))
            }
            case 'JOIN': {
                const { 자신, 구분자 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('목록이 아니면 합칠 수 없어요.')
                }
                if (!(구분자 instanceof StringValue)) {
                    throw new Error('구분자는 문자열이어야 해요.')
                }
                const joined = Array.from(자신.enumerate()).map(v => v.toPrint()).join(구분자.value)
                return new StringValue(joined)
            }
            default:
                throw new Error(`알 수 없는 표준 동작: ${action}`)
        }
    }
}
