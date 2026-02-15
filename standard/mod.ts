import {
    BooleanValue,
    type Extension,
    ExtensionManifest,
    NumberValue,
    ListValue,
    StringValue,
    ValueType,
    FunctionInvokingParams,
    IndexedValue,
    Scope,
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

메소드(사전, 리스트), 번역(표준), 키들
***
KEYS
***

메소드(사전, 리스트), 번역(표준), (키)를/을 (기본값)으로/로 가져오기
***
GET
***

메소드(문자, 리스트, 사전), 번역(표준), 안에 (대상)이/가 있는지/있는지확인
***
INCLUDES
***

번역(표준), (리스트)를/을 (판별함수)로 filter/거르기
***
FILTER
***
`,
        },
    }

    async executeFFI(
        code: string,
        args: FunctionInvokingParams,
        callerScope: Scope,
    ): Promise<ValueType> {
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
                const sum = Array.from(자신.enumerate()).reduce(
                    (acc: number, curr: ValueType) => {
                    if (!(curr instanceof NumberValue)) {
                        throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                    }
                    return acc + curr.value
                    },
                    0,
                )
                return new NumberValue(sum)
            }
            case 'PRODUCT': {
                const { 자신 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('곱을 구할 수 없는 대상이에요.')
                }
                const product = Array.from(자신.enumerate()).reduce(
                    (acc: number, curr: ValueType) => {
                        if (!(curr instanceof NumberValue)) {
                            throw new Error('목록에 숫자가 아닌 값이 들어있어요.')
                        }
                        return acc * curr.value
                    },
                    1,
                )
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
                const joined = Array.from(자신.enumerate())
                    .map((v: ValueType) => v.toPrint())
                    .join(구분자.value)
                return new StringValue(joined)
            }
            case 'KEYS': {
                const { 자신 } = args
                if (!(자신 instanceof IndexedValue)) {
                    throw new Error('사전이나 목록이 아니면 키를 가져올 수 없어요.')
                }
                const keys = Array.from(자신.entries.keys()).map(k => {
                    if (typeof k === 'number') return new NumberValue(k)
                    return new StringValue(String(k))
                })
                return new ListValue(keys)
            }
            case 'GET': {
                const { 자신, 키, 기본값 } = args
                if (!(자신 instanceof IndexedValue)) {
                    throw new Error('사전이나 목록이 아니면 값을 가져올 수 없어요.')
                }
                const key = (키 instanceof NumberValue || 키 instanceof StringValue) ? 키.value : 키.toPrint()
                const value = 자신.entries.get(key as any)
                return value ?? 기본값
            }
            case 'INCLUDES': {
                const { 자신, 대상 } = args
                if (자신 instanceof StringValue && 대상 instanceof StringValue) {
                    return new StringValue(자신.value.includes(대상.value) ? "참" : "거짓")
                }
                if (자신 instanceof ListValue) {
                    const found = Array.from(자신.enumerate()).some(item => item.toPrint() === 대상.toPrint())
                    return new StringValue(found ? "참" : "거짓")
                }
                if (자신 instanceof IndexedValue) {
                    const key = (대상 instanceof NumberValue || 대상 instanceof StringValue) ? 대상.value : 대상.toPrint()
                    return new StringValue(자신.entries.has(key as any) ? "참" : "거짓")
                }
                throw new Error('포함 여부를 확인할 수 없는 대상이에요.')
            }
            case 'FILTER': {
                const 리스트 = args.리스트 ?? args.자신
                const 판별함수 = args.판별함수

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 거를 수 없어요.')
                }

                if (!isRunnableObject(판별함수)) {
                    throw new Error('판별함수는 약속(람다)이어야 해요.')
                }

                const firstParamName = 판별함수.paramNames[0]
                const secondParamName = 판별함수.paramNames[1]
                const filtered: ValueType[] = []

                for (const [index, item] of Array.from(리스트.enumerate()).entries()) {
                    const runArgs: Record<string, ValueType> = {}

                    if (firstParamName) {
                        runArgs[firstParamName] = item
                    }

                    if (secondParamName) {
                        runArgs[secondParamName] = new NumberValue(index)
                    }

                    const result = await 판별함수.run(runArgs, callerScope)
                    if (isTruthy(result)) {
                        filtered.push(item)
                    }
                }

                return new ListValue(filtered)
            }
            default:
                throw new Error(`알 수 없는 표준 동작: ${action}`)
        }
    }
}

function isRunnableObject(
    value: ValueType | undefined,
): value is ValueType & {
    run(
        args: Record<string, ValueType>,
        fileScope?: Scope,
    ): Promise<ValueType>
    paramNames: string[]
} {
    if (!value || !('run' in value) || typeof value.run !== 'function') {
        return false
    }

    if (!('paramNames' in value) || !Array.isArray(value.paramNames)) {
        return false
    }

    return true
}

function isTruthy(value: ValueType): boolean {
    if (value instanceof BooleanValue) {
        return value.value
    }

    if (value instanceof NumberValue) {
        return value.value !== 0
    }

    if (value instanceof StringValue) {
        return value.value !== ''
    }

    return !!value
}
