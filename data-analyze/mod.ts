import { type Extension, ExtensionManifest, GreaterThanOrEqualOperator, IndexedValue, LessThanOrEqualOperator, ListValue, NumberValue, Operator, StringValue, TargetIsNotIndexedValueError, ValueType } from "@dalbit-yaksok/core"
import { FunctionInvokingParams } from "../core/constant/type.ts";
import { 편의점 } from "./virtual-data/편의점.ts";

export class DataAnalyze implements Extension {
    public manifest: ExtensionManifest = {
      ffiRunner: {
        runtimeName: "분석"
      },
        module: {
          '분석': `
번역(분석), (데이터)중 (컬럼)가 (값)인 값들/값/것들/것
***
FIND_COLUMN_EQUAL
***

번역(분석), (데이터)중 (컬럼)이/가 (기준) 이상인 것들/값들/것/값
***
FIND_GTE
***

번역(분석), (데이터) (컬럼) 순서로/순으로/오름차순으로 정렬/정렬하기/정렬하고
***
SORT_BY_COLUMN_ASC
***

번역(분석), (데이터) (컬럼) 역순서로/역순으로/내림차순으로 정렬/정렬하기/정렬하고
***
SORT_BY_COLUMN_DESC
***
`,
"데이터_불러오기": `
약속, 편의점 데이터
    데 = ${편의점}
    데 반환하기
`
        }
    }

    executeFFI(code: string, args: FunctionInvokingParams): ValueType | Promise<ValueType> {
      const action = code.trim()

      if(action === 'FIND_COLUMN_EQUAL') {
        const { 데이터, 컬럼, 값 } = args

        this.assertKey(컬럼)
        this.assertListValue(데이터)

        return this.findColumnEqual(데이터, 컬럼, 값)
      } else if(action === 'FIND_GTE') {
        const { 데이터, 컬럼, 기준 } = args

        this.assertKey(컬럼)
        this.assertListValue(데이터)

        return this.findGte(데이터, 컬럼, 기준)
      } else if(action === 'SORT_BY_COLUMN_ASC') {
        const { 데이터, 컬럼 } = args

        this.assertKey(컬럼)
        this.assertListValue(데이터)

        return this.sortByColumn(데이터, 컬럼, 'desc')
      } else if(action === "SORT_BY_COLUMN_DESC") {
        const {데이터, 컬럼} = args

        this.assertKey(컬럼)
        this.assertListValue(데이터)

        return this.sortByColumn(데이터, 컬럼, 'asc')
      }
    }

    findColumnEqual(data: ListValue, column: StringValue | NumberValue, value: ValueType): ListValue {
      const newData = [...data.enumerate()].filter(item => {
        if(!(item instanceof IndexedValue)) {
          throw "Not IndexedValue"
        }

        return item.getItem(column.value).toPrint() === value.toPrint()
      })

      return new ListValue(newData)
    }

    findGte(data: ListValue, column: StringValue | NumberValue, criteria: ValueType): ListValue {
      const lte = new GreaterThanOrEqualOperator([])

      const newData = [...data.enumerate()].filter(item => {
        if(!(item instanceof IndexedValue)) {
          throw "Not IndexedValue"
        }

        return lte.call(item.getItem(column.value), criteria).value
      })

      return new ListValue(newData)
    }
     
    sortByColumn(data: ListValue, column: StringValue | NumberValue, type: |"asc"|"desc"): ListValue {
      const operator = type === "desc" ? new LessThanOrEqualOperator([]): new GreaterThanOrEqualOperator([])

      const newData = [...data.enumerate()].toSorted((a, b) => {
        if(!(a instanceof IndexedValue) || !(b instanceof IndexedValue)) {
          throw "Not IndexedValue"
        }

        return operator.call(a.getItem(column.value), b.getItem(column.value)).value ? -1 : 1
      })

      return new ListValue(newData)
    }

    assertListValue(value: ValueType): asserts value is ListValue {
      if(!(value instanceof ListValue)) {
        throw new Error('Expected ListValue')
      }
    }

    assertKey(value: ValueType): asserts value is StringValue | NumberValue {
      if(!(value instanceof StringValue || value instanceof NumberValue)) {
        throw new Error('Expected StringValue or NumberValue')
      }
    }
}
