import {
    type Extension,
    ExtensionManifest,
    GreaterThanOrEqualOperator,
    IndexedValue,
    LessThanOperator,
    LessThanOrEqualOperator,
    ListValue,
    NumberValue,
    StringValue,
    ValueType,
    FunctionInvokingParams
} from '@dalbit-yaksok/core'
import { 편의점 } from './virtual-data/cvs.ts'

export class DataAnalyze implements Extension {
    public manifest: ExtensionManifest = {
        ffiRunner: {
            runtimeName: '분석',
        },
        module: {
            분석: `
번역(분석), (데이터)중 (컬럼)가 (값)인 값들/값/것들/것
***
FIND_COLUMN_EQUAL
***

번역(분석), (데이터)중 (컬럼)이/가 (기준) 이상인 것들/값들/것/값
***
FIND_GTE
***

번역(분석), (데이터)중 (컬럼)이/가 (기준) 보다 작은 것들/값들/것/값
***
FIND_LT
***

번역(분석), (데이터)중 (컬럼)이/가 (기준) 미만인 것들/값들/것/값
***
FIND_LT
***

번역(분석), (데이터) (컬럼) 순서로/순으로/오름차순으로 정렬/정렬하기/정렬하고/정렬해서
***
SORT_BY_COLUMN_ASC
***

번역(분석), (데이터) (컬럼) 역순서로/역순으로/내림차순으로 정렬/정렬하기/정렬하고/정렬해서
***
SORT_BY_COLUMN_DESC
***

번역(분석), (데이터) 앞에서 (개수)개 가져오기/뽑기/돌려주기
***
TAKE_FIRST_N
***

번역(분석), (데이터) 앞에서 (개수)개/개만
***
TAKE_FIRST_N
***

번역(분석), (데이터) 개수/갯수/길이 세기/구하기/알아보기
***
COUNT_ROWS
***

번역(분석), (데이터)에서/중 (컬럼)에 (값)이/가 포함된 값들/것들/값/것 가져오기/찾기/가져와서/찾아서
***
FIND_VALUE_CONTAINS
***

번역(분석), (데이터)에서/중 (컬럼)에 (값)이/가 포함된 값/값의/값들/것들/것/것의
***
FIND_VALUE_CONTAINS
***

번역(분석), (데이터)에서/중 (컬럼) 가져오기/가져와서
***
GET_COLUMNS
***

번역(분석), (데이터)에서/중 (컬럼)만 가져오기/가져와서
***
GET_COLUMNS
***
`,
            데이터_불러오기: `
약속, 편의점 데이터
    데 = ${편의점}
    데 반환하기
`,
        },
    }

    executeFFI(
        code: string,
        args: FunctionInvokingParams,
    ): ValueType | Promise<ValueType> {
        const action = code.trim()

        if (action === 'FIND_COLUMN_EQUAL') {
            const { 데이터, 컬럼, 값 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.findColumnEqual(데이터, 컬럼, 값)
        } else if (action === 'FIND_GTE') {
            const { 데이터, 컬럼, 기준 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.findGte(데이터, 컬럼, 기준)
        } else if (action === 'FIND_LT') {
            const { 데이터, 컬럼, 기준 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.findLt(데이터, 컬럼, 기준)
        } else if (action === 'SORT_BY_COLUMN_ASC') {
            const { 데이터, 컬럼 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.sortByColumn(데이터, 컬럼, 'desc')
        } else if (action === 'SORT_BY_COLUMN_DESC') {
            const { 데이터, 컬럼 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.sortByColumn(데이터, 컬럼, 'asc')
        } else if (action === 'TAKE_FIRST_N') {
            const { 데이터, 개수 } = args

            this.assertListValue(데이터)
            this.assertNumber(개수)

            return this.takeFirstN(데이터, 개수)
        } else if (action === 'COUNT_ROWS') {
            const { 데이터 } = args

            this.assertListValue(데이터)

            return this.countRows(데이터)
        } else if (action === 'FIND_VALUE_CONTAINS') {
            const { 데이터, 컬럼, 값 } = args

            this.assertKey(컬럼)
            this.assertListValue(데이터)

            return this.findValueContains(데이터, 컬럼, 값)
        } else if (action === 'GET_COLUMNS') {
            const { 데이터, 컬럼 } = args

            this.assertListValue(데이터)

            try {
              this.assertListValue(컬럼)
              return this.getColumns(데이터, 컬럼)
            } catch (_) {
              this.assertKey(컬럼)
              return this.getColumn(데이터, 컬럼)
            }
        }

        throw new Error(`Unknown action: ${action}`)
    }

    findValueContains(
        data: ListValue,
        column: StringValue | NumberValue,
        value: ValueType,
    ): ListValue {
        const newData = [...data.enumerate()].filter((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            return item
                .getItem(column.value)
                .toPrint()
                .includes(value.toPrint())
        })

        return new ListValue(newData)
    }

    findColumnEqual(
        data: ListValue,
        column: StringValue | NumberValue,
        value: ValueType,
    ): ListValue {
        const newData = [...data.enumerate()].filter((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            return item.getItem(column.value).toPrint() === value.toPrint()
        })

        return new ListValue(newData)
    }

    findLt(
        data: ListValue,
        column: StringValue | NumberValue,
        criteria: ValueType,
    ): ListValue {
        const lt = new LessThanOperator([])

        const newData = [...data.enumerate()].filter((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }
            return lt.call(item.getItem(column.value), criteria).value
        })
        return new ListValue(newData)
    }

    findGte(
        data: ListValue,
        column: StringValue | NumberValue,
        criteria: ValueType,
    ): ListValue {
        const lte = new GreaterThanOrEqualOperator([])

        const newData = [...data.enumerate()].filter((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            return lte.call(item.getItem(column.value), criteria).value
        })

        return new ListValue(newData)
    }

    takeFirstN(data: ListValue, count: NumberValue): ListValue {
        const limit = Math.max(0, Math.floor(count.value))
        const enumerated = [...data.enumerate()]

        return new ListValue(enumerated.slice(0, limit))
    }

    countRows(data: ListValue): NumberValue {
        return new NumberValue([...data.enumerate()].length)
    }

    sortByColumn(
        data: ListValue,
        column: StringValue | NumberValue,
        type: 'asc' | 'desc',
    ): ListValue {
        const operator =
            type === 'desc'
                ? new LessThanOrEqualOperator([])
                : new GreaterThanOrEqualOperator([])

        const newData = [...data.enumerate()].toSorted((a, b) => {
            if (!(a instanceof IndexedValue) || !(b instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            return operator.call(
                a.getItem(column.value),
                b.getItem(column.value),
            ).value
                ? -1
                : 1
        })

        return new ListValue(newData)
    }

    getColumns(data: ListValue, columns: ListValue): ListValue {
        const newData = [...data.enumerate()].map((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            const keys = [...columns.enumerate()].map((column) => {
                this.assertKey(column)
                return column.value
            })

            const newValues = new Map(
                keys.map((key) => [key, item.getItem(key)]),
            )
            return new IndexedValue(newValues)
        })

        return new ListValue(newData)
    }

    getColumn(data: ListValue, column: StringValue | NumberValue): ListValue {
        const newData = [...data.enumerate()].map((item) => {
            if (!(item instanceof IndexedValue)) {
                throw 'Not IndexedValue'
            }

            return item.getItem(column.value)
        })

        return new ListValue(newData)
    }

    assertListValue(value: ValueType): asserts value is ListValue {
        if (!(value instanceof ListValue)) {
            throw new Error('Expected ListValue')
        }
    }

    assertNumber(value: ValueType): asserts value is NumberValue {
        if (!(value instanceof NumberValue)) {
            throw new Error('Expected NumberValue')
        }
    }

    assertKey(value: ValueType): asserts value is StringValue | NumberValue {
        if (!(value instanceof StringValue || value instanceof NumberValue)) {
            throw new Error('Expected StringValue or NumberValue')
        }
    }
}
