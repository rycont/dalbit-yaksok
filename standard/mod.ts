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

메소드(문자, 리스트, 사전), 번역(표준), 안에 (대상)이/가 있는지
***
INCLUDES
***

메소드(문자, 리스트, 사전), 번역(표준), 안에 (대상)이/가 있는지확인
***
INCLUDES
***

메소드(리스트), 번역(표준), (판별함수)로 filter/거르기
***
FILTER
***

메소드(리스트), 번역(표준), (변환함수)로 map/변환하기
***
MAP
***

메소드(문자), 번역(표준), (찾을문자)를/을 (바꿀문자)로/으로 바꾸기
***
REPLACE
***

메소드(리스트), 번역(표준), 모두 (판별함수) 인지
***
EVERY
***

메소드(리스트), 번역(표준), (판별함수)로 every/모두확인하기
***
EVERY
***

메소드(리스트), 번역(표준), 하나라도 (판별함수) 인지
***
SOME
***

메소드(리스트), 번역(표준), (판별함수)로 some/하나라도확인하기
***
SOME
***

메소드(리스트), 번역(표준), 정렬하기
***
SORT_DEFAULT
***

메소드(리스트), 번역(표준), (비교함수)로 정렬하기
***
SORT_WITH_FUNC
***`,
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
                return new ListValue(parts.map((p) => new StringValue(p)))
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
                    throw new Error(
                        '사전이나 목록이 아니면 키를 가져올 수 없어요.',
                    )
                }
                const keys = Array.from(자신.getEntries()).map(([k]) => {
                    if (typeof k === 'number') return new NumberValue(k)
                    return new StringValue(String(k))
                })
                return new ListValue(keys)
            }
            case 'GET': {
                const { 자신, 키, 기본값 } = args
                if (!(자신 instanceof IndexedValue)) {
                    throw new Error(
                        '사전이나 목록이 아니면 값을 가져올 수 없어요.',
                    )
                }
                const key = getIndexKeyValue(키)

                const item = tryGetIndexedItem(자신, key)
                if (!item.found) {
                    return 기본값
                }

                return item.value
            }
            case 'INCLUDES': {
                const { 자신, 대상 } = args
                if (
                    자신 instanceof StringValue &&
                    대상 instanceof StringValue
                ) {
                    return new StringValue(
                        자신.value.includes(대상.value) ? '참' : '거짓',
                    )
                }
                if (자신 instanceof ListValue) {
                    const found = Array.from(자신.enumerate()).some(
                        (item) => item.toPrint() === 대상.toPrint(),
                    )
                    return new StringValue(found ? '참' : '거짓')
                }
                if (자신 instanceof IndexedValue) {
                    const key = getIndexKeyValue(대상)
                    const found = tryGetIndexedItem(자신, key).found
                    return new StringValue(found ? '참' : '거짓')
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

                for (const [index, item] of Array.from(
                    리스트.enumerate(),
                ).entries()) {
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
            case 'MAP': {
                const 리스트 = args.리스트 ?? args.자신
                const 변환함수 = args.변환함수

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 변환할 수 없어요.')
                }

                if (!isRunnableObject(변환함수)) {
                    throw new Error('변환함수는 약속(람다)이어야 해요.')
                }

                const firstParamName = 변환함수.paramNames[0]
                const secondParamName = 변환함수.paramNames[1]
                const mapped: ValueType[] = []

                for (const [index, item] of Array.from(
                    리스트.enumerate(),
                ).entries()) {
                    const runArgs: Record<string, ValueType> = {}

                    if (firstParamName) {
                        runArgs[firstParamName] = item
                    }

                    if (secondParamName) {
                        runArgs[secondParamName] = new NumberValue(index)
                    }

                    const result = await 변환함수.run(runArgs, callerScope)
                    mapped.push(result)
                }

                return new ListValue(mapped)
            }
            case 'EVERY': {
                const 리스트 = args.리스트 ?? args.자신
                const 판별함수 = args.판별함수

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 확인할 수 없어요.')
                }

                if (!isRunnableObject(판별함수)) {
                    throw new Error('판별함수는 약속(람다)이어야 해요.')
                }

                const firstParamName = 판별함수.paramNames[0]
                const secondParamName = 판별함수.paramNames[1]

                for (const [index, item] of Array.from(
                    리스트.enumerate(),
                ).entries()) {
                    const runArgs: Record<string, ValueType> = {}

                    if (firstParamName) {
                        runArgs[firstParamName] = item
                    }

                    if (secondParamName) {
                        runArgs[secondParamName] = new NumberValue(index)
                    }

                    const result = await 판별함수.run(runArgs, callerScope)
                    if (!isTruthy(result)) {
                        return new StringValue('거짓')
                    }
                }

                return new StringValue('참')
            }
            case 'SOME': {
                const 리스트 = args.리스트 ?? args.자신
                const 판별함수 = args.판별함수

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 확인할 수 없어요.')
                }

                if (!isRunnableObject(판별함수)) {
                    throw new Error('판별함수는 약속(람다)이어야 해요.')
                }

                const firstParamName = 판별함수.paramNames[0]
                const secondParamName = 판별함수.paramNames[1]

                for (const [index, item] of Array.from(
                    리스트.enumerate(),
                ).entries()) {
                    const runArgs: Record<string, ValueType> = {}

                    if (firstParamName) {
                        runArgs[firstParamName] = item
                    }

                    if (secondParamName) {
                        runArgs[secondParamName] = new NumberValue(index)
                    }

                    const result = await 판별함수.run(runArgs, callerScope)
                    if (isTruthy(result)) {
                        return new StringValue('참')
                    }
                }

                return new StringValue('거짓')
            }
            case 'SORT_DEFAULT': {
                const 리스트 = args.자신

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 정렬할 수 없어요.')
                }

                const items = Array.from(리스트.enumerate())

                items.sort((a, b) => {
                    if (a instanceof NumberValue && b instanceof NumberValue) {
                        return a.value - b.value
                    }
                    const aStr = a.toPrint()
                    const bStr = b.toPrint()
                    return aStr.localeCompare(bStr)
                })

                return new ListValue(items)
            }
            case 'SORT_WITH_FUNC': {
                // Modified: Now it's a regular function call, not a method.
                // args.자신 might be undefined, args.리스트 should be present.
                const 리스트 = args.리스트 ?? args.자신
                const 비교함수 = args.비교함수

                if (!(리스트 instanceof ListValue)) {
                    throw new Error('목록이 아니면 정렬할 수 없어요.')
                }

                if (!isRunnableObject(비교함수)) {
                    throw new Error('비교함수는 약속(람다)이어야 해요.')
                }

                const mergeSort = async (
                    arr: ValueType[],
                ): Promise<ValueType[]> => {
                    if (arr.length <= 1) return arr
                    const mid = Math.floor(arr.length / 2)
                    const left = await mergeSort(arr.slice(0, mid))
                    const right = await mergeSort(arr.slice(mid))
                    return await merge(left, right)
                }

                const merge = async (
                    left: ValueType[],
                    right: ValueType[],
                ) => {
                    const sorted: ValueType[] = []
                    let i = 0
                    let j = 0

                    while (i < left.length && j < right.length) {
                        const runArgs: Record<string, ValueType> = {}
                        if (비교함수.paramNames[0])
                            runArgs[비교함수.paramNames[0]] = left[i]
                        if (비교함수.paramNames[1])
                            runArgs[비교함수.paramNames[1]] = right[j]

                        const result = await 비교함수.run(runArgs, callerScope)

                        if (!(result instanceof NumberValue)) {
                            throw new Error(
                                '비교함수는 숫자를 반환해야 해요. (음수: 앞이 작음, 0: 같음, 양수: 앞이 큼)',
                            )
                        }

                        if (result.value <= 0) {
                            sorted.push(left[i])
                            i++
                        } else {
                            sorted.push(right[j])
                            j++
                        }
                    }
                    return [...sorted, ...left.slice(i), ...right.slice(j)]
                }

                const items = await mergeSort(Array.from(리스트.enumerate()))

                return new ListValue(items)
            }
            case 'REPLACE': {
                const { 자신, 대상, 찾을문자, 바꿀문자 } = args
                const target = 자신 ?? 대상
                if (!(target instanceof StringValue)) {
                    throw new Error('문자열이 아니면 바꿀 수 없어요.')
                }
                if (!(찾을문자 instanceof StringValue)) {
                    throw new Error('찾을 문자는 문자열이어야 해요.')
                }
                if (!(바꿀문자 instanceof StringValue)) {
                    throw new Error('바꿀 문자는 문자열이어야 해요.')
                }
                const replaced = target.value.replaceAll(
                    찾을문자.value,
                    바꿀문자.value,
                )
                return new StringValue(replaced)
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

function getIndexKeyValue(value: ValueType): string | number {
    if (value instanceof NumberValue || value instanceof StringValue) {
        return value.value
    }

    return value.toPrint()
}

function tryGetIndexedItem(
    target: IndexedValue,
    key: string | number,
): { found: true; value: ValueType } | { found: false } {
    try {
        return {
            found: true,
            value: target.getItem(key),
        }
    } catch {
        return { found: false }
    }
}
