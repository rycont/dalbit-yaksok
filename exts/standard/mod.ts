import {
    BooleanValue,
    type Extension,
    ExtensionManifest,
    FunctionInvokingParams,
    IndexedValue,
    ListValue,
    NumberValue,
    Scope,
    StringValue,
    TupleValue,
    ValueType,
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

메소드(리스트), 번역(표준), 합계 구하기
***
SUM
***

메소드(리스트), 번역(표준), 곱 구하기
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

메소드(사전, 리스트), 번역(표준), 키들 가져오기
***
KEYS
***

메소드(사전, 리스트), 번역(표준), 값들 가져오기
***
VALUES
***

메소드(사전, 리스트), 번역(표준), (키)를/을 (기본값)으로/로 가져오기
***
GET
***

메소드(문자, 리스트, 사전), 번역(표준), 안에 (대상)이/가 있는지
***
INCLUDES
***

메소드(문자, 리스트), 번역(표준), (판별함수)으로/로 거르기
***
FILTER
***

메소드(리스트), 번역(표준), (변환함수)으로/로 map/변환하기
***
MAP
***

메소드(문자), 번역(표준), (찾을문자)를/을 (바꿀문자)로/으로 바꾸기
***
REPLACE
***

메소드(문자), 번역(표준), (패턴) 찾기
***
FIND
***

메소드(리스트), 번역(표준), 모두 (판별함수) 인지
***
EVERY
***

메소드(리스트), 번역(표준), 하나라도 (판별함수) 인지
***
SOME
***

메소드(리스트), 번역(표준), 정렬하기
***
SORT_DEFAULT
***

메소드(리스트), 번역(표준), 최댓값 찾기
***
MAX
***

메소드(리스트), 번역(표준), 최솟값 찾기
***
MIN
***

메소드(리스트), 번역(표준), 펼치기
***
FLATTEN
***

메소드(문자, 리스트), 번역(표준), 중복제거
***
UNIQUE
***

메소드(문자, 리스트), 번역(표준), 빈도 구하기
***
FREQUENCY
***

메소드(문자, 리스트, 숫자, 사전), 번역(표준), 값 종류
***
TYPE
***

메소드(리스트), 번역(표준), (항목) 추가하기
***
APPEND
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
                if (자신 instanceof ListValue || 자신 instanceof TupleValue) {
                    const length = Array.from(자신.enumerate()).length
                    return new NumberValue(length)
                }
                throw new Error('길이를 구할 수 없는 대상이에요.')
            }
            case 'SUM': {
                const { 자신 } = args
                if (
                    !(자신 instanceof ListValue || 자신 instanceof TupleValue)
                ) {
                    throw new Error('합계를 구할 수 없는 대상이에요.')
                }
                const sum = Array.from(자신.enumerate()).reduce(
                    (acc: number, curr: ValueType) => {
                        if (!(curr instanceof NumberValue)) {
                            throw new Error(
                                '목록에 숫자가 아닌 값이 들어있어요.',
                            )
                        }
                        return acc + curr.value
                    },
                    0,
                )
                return new NumberValue(sum)
            }
            case 'PRODUCT': {
                const { 자신 } = args
                if (
                    !(자신 instanceof ListValue || 자신 instanceof TupleValue)
                ) {
                    throw new Error('곱을 구할 수 없는 대상이에요.')
                }
                const product = Array.from(자신.enumerate()).reduce(
                    (acc: number, curr: ValueType) => {
                        if (!(curr instanceof NumberValue)) {
                            throw new Error(
                                '목록에 숫자가 아닌 값이 들어있어요.',
                            )
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
            case 'VALUES': {
                const { 자신 } = args
                if (!(자신 instanceof IndexedValue)) {
                    throw new Error(
                        '사전이나 목록이 아니면 값들을 가져올 수 없어요.',
                    )
                }
                const values = Array.from(자신.getEntries()).map(([, v]) => v)
                return new ListValue(values)
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
                    return new BooleanValue(자신.value.includes(대상.value))
                }
                if (자신 instanceof ListValue) {
                    const found = Array.from(자신.enumerate()).some(
                        (item) => item.toPrint() === 대상.toPrint(),
                    )
                    return new BooleanValue(found)
                }
                if (자신 instanceof IndexedValue) {
                    const key = getIndexKeyValue(대상)
                    const found = tryGetIndexedItem(자신, key).found
                    return new BooleanValue(found)
                }
                throw new Error('포함 여부를 확인할 수 없는 대상이에요.')
            }
            case 'FILTER': {
                const 리스트 = args.리스트 ?? args.자신
                const 판별함수 = args.판별함수

                if (!isRunnableObject(판별함수)) {
                    throw new Error('판별함수는 약속(람다)이어야 해요.')
                }

                const firstParamName = 판별함수.paramNames[0]
                const secondParamName = 판별함수.paramNames[1]

                if (리스트 instanceof StringValue) {
                    const filteredChars: string[] = []
                    for (let i = 0; i < 리스트.value.length; i++) {
                        const char = 리스트.value[i]
                        const runArgs: Record<string, ValueType> = {}

                        if (firstParamName) {
                            runArgs[firstParamName] = new StringValue(char)
                        }
                        if (secondParamName) {
                            runArgs[secondParamName] = new NumberValue(i)
                        }

                        const result = await 판별함수.run(runArgs, callerScope)
                        if (isTruthy(result)) {
                            filteredChars.push(char)
                        }
                    }
                    return new StringValue(filteredChars.join(''))
                } else if (리스트 instanceof ListValue) {
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
                } else {
                    throw new Error('문자열이나 목록이 아니면 거를 수 없어요.')
                }
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
                        return new BooleanValue(false)
                    }
                }

                return new BooleanValue(true)
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
                        return new BooleanValue(true)
                    }
                }

                return new BooleanValue(false)
            }
            case 'MAX': {
                const { 자신 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('최댓값을 구할 수 없는 대상이에요.')
                }
                const items = Array.from(자신.enumerate())
                if (items.length === 0) {
                    throw new Error('빈 목록에서는 최댓값을 구할 수 없어요.')
                }
                const max = items.reduce((acc, curr) => {
                    if (
                        acc instanceof NumberValue &&
                        curr instanceof NumberValue
                    ) {
                        return curr.value > acc.value ? curr : acc
                    }
                    return curr.toPrint().localeCompare(acc.toPrint()) > 0
                        ? curr
                        : acc
                })
                return max
            }
            case 'MIN': {
                const { 자신 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('최솟값을 구할 수 없는 대상이에요.')
                }
                const items = Array.from(자신.enumerate())
                if (items.length === 0) {
                    throw new Error('빈 목록에서는 최솟값을 구할 수 없어요.')
                }
                const min = items.reduce((acc, curr) => {
                    if (
                        acc instanceof NumberValue &&
                        curr instanceof NumberValue
                    ) {
                        return curr.value < acc.value ? curr : acc
                    }
                    return curr.toPrint().localeCompare(acc.toPrint()) < 0
                        ? curr
                        : acc
                })
                return min
            }
            case 'FLATTEN': {
                const { 자신 } = args
                if (
                    !(자신 instanceof ListValue || 자신 instanceof TupleValue)
                ) {
                    throw new Error('목록이나 튜플이 아니면 펼칠 수 없어요.')
                }
                const items = Array.from(자신.enumerate())
                const flattened: ValueType[] = []
                for (const item of items) {
                    if (
                        item instanceof ListValue ||
                        item instanceof TupleValue
                    ) {
                        flattened.push(...Array.from(item.enumerate()))
                    } else {
                        flattened.push(item)
                    }
                }
                return new ListValue(flattened)
            }
            case 'UNIQUE': {
                const { 자신 } = args
                if (자신 instanceof StringValue) {
                    const uniqueChars = Array.from(new Set(자신.value))
                    return new StringValue(uniqueChars.join(''))
                }
                if (자신 instanceof ListValue || 자신 instanceof TupleValue) {
                    const items = Array.from(자신.enumerate())
                    const seen = new Set<string>()
                    const unique: ValueType[] = []
                    for (const item of items) {
                        const key = item.toPrint()
                        if (!seen.has(key)) {
                            seen.add(key)
                            unique.push(item)
                        }
                    }
                    return new ListValue(unique)
                }
                throw new Error('중복을 제거할 수 없는 대상이에요.')
            }
            case 'FREQUENCY': {
                const { 자신 } = args
                if (
                    !(
                        자신 instanceof ListValue ||
                        자신 instanceof TupleValue ||
                        자신 instanceof StringValue
                    )
                ) {
                    throw new Error(
                        '문자열, 목록이나 튜플이 아니면 빈도를 샐 수 없어요.',
                    )
                }
                const items =
                    자신 instanceof StringValue
                        ? 자신.value.split('').map((c) => new StringValue(c))
                        : Array.from(자신.enumerate())

                const counts = new Map<string | number, number>()
                for (const item of items) {
                    const key = getIndexKeyValue(item)
                    counts.set(key, (counts.get(key) ?? 0) + 1)
                }
                const entries = new Map<string | number, ValueType>()
                for (const [key, count] of counts.entries()) {
                    entries.set(key, new NumberValue(count))
                }
                return new IndexedValue(entries)
            }
            case 'TYPE': {
                const { 자신 } = args
                if (자신 instanceof NumberValue) return new StringValue('숫자')
                if (자신 instanceof StringValue) return new StringValue('문자')
                if (자신 instanceof ListValue) return new StringValue('목록')
                if (자신 instanceof IndexedValue) return new StringValue('사전')
                return new StringValue('기타')
            }
            case 'APPEND': {
                const { 자신, 항목 } = args
                if (!(자신 instanceof ListValue)) {
                    throw new Error('목록이 아니면 항목을 추가할 수 없어요.')
                }
                자신.setItem(자신.entries.size, 항목)
                return 자신
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

                const merge = async (left: ValueType[], right: ValueType[]) => {
                    const sorted: ValueType[] = []
                    let i = 0
                    let j = 0

                    while (i < left.length && j < right.length) {
                        const runArgs: Record<string, ValueType> = {}
                        if (비교함수.paramNames[0]) {
                            runArgs[비교함수.paramNames[0]] = left[i]
                        }
                        if (비교함수.paramNames[1]) {
                            runArgs[비교함수.paramNames[1]] = right[j]
                        }

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
            case 'FIND': {
                const { 자신, 패턴 } = args
                if (!(자신 instanceof StringValue)) {
                    throw new Error('문자열이 아니면 찾을 수 없어요.')
                }

                const regex =
                    패턴 instanceof StringValue
                        ? new RegExp(패턴.value, 'g')
                        : (패턴 as any) // Handle RegexValue if integrated or just use native match

                const matches = 자신.value.match(regex)
                if (!matches) return new ListValue([])
                return new ListValue(matches.map((m) => new StringValue(m)))
            }
            default:
                throw new Error(`알 수 없는 표준 동작: ${action}`)
        }
    }
}

function isRunnableObject(value: ValueType | undefined): value is ValueType & {
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
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
