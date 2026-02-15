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
번역(표준), (대상)의 길이
***
LENGTH
***

번역(표준), (목록)의 합계
***
SUM
***

번역(표준), (목록)의 모든 곱
***
PRODUCT
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
                const { 대상 } = args
                if (대상 instanceof StringValue) {
                    return new NumberValue(대상.value.length)
                }
                if (대상 instanceof ListValue) {
                    const length = Array.from(대상.enumerate()).length
                    return new NumberValue(length)
                }
                throw new Error('길이를 구할 수 없는 대상이에요. 문자열이나 목록이어야 해요.')
            }
            case 'SUM': {
                const { 목록 } = args
                if (!(목록 instanceof ListValue)) {
                    throw new Error('합계를 구할 수 없는 대상이에요. 목록이어야 해요.')
                }
                const sum = Array.from(목록.enumerate()).reduce((acc, curr) => {
                    if (!(curr instanceof NumberValue)) {
                        throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                    }
                    return acc + curr.value
                }, 0)
                return new NumberValue(sum)
            }
            case 'PRODUCT': {
                const { 목록 } = args
                if (!(목록 instanceof ListValue)) {
                    throw new Error('곱을 구할 수 없는 대상이에요. 목록이어야 해요.')
                }
                const product = Array.from(목록.enumerate()).reduce((acc, curr) => {
                    if (!(curr instanceof NumberValue)) {
                        throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                    }
                    return acc * curr.value
                }, 1)
                return new NumberValue(product)
            }
            default:
                throw new Error(`알 수 없는 표준 동작: ${action}`)
        }
    }
}
