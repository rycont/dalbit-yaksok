import { Operator } from '../node/base.ts'
import type { Formula } from '../node/calculation.ts'
import { operatorToText, valueTypeToText, YaksokError } from './common.ts'

import type { Position } from '../type/position.ts'
import { ValueType } from '../value/base.ts'
import { Token } from '../prepare/tokenize/token.ts'

export class UnknownOperatorError extends YaksokError {
    constructor(props: {
        position?: Position
        tokens?: Token[]
        resource: {
            operator: Operator
        }
    }) {
        super(props)

        this.message = `${operatorToText(
            props.resource.operator,
        )}는 알 수 없는 연산자에요.`
    }
}

export class InvalidTypeForCompareError extends YaksokError {
    constructor(props: {
        position?: Position
        resource: {
            left: ValueType
            right: ValueType
        }
    }) {
        super(props)

        const leftText = valueTypeToText(props.resource.left)
        const rightText = valueTypeToText(props.resource.right)

        this.message = `${leftText}와 ${rightText}는 서로 비교할 수 없습니다. 값의 종류를 일치시켜 주세요.`
    }
}

export class InvalidTypeForOperatorError extends YaksokError {
    constructor(props: {
        position?: Position
        tokens?: Token[]
        resource: {
            operator: Operator
            operands: ValueType[]
        }
    }) {
        super(props)

        const operandsText = props.resource.operands
            .map(valueTypeToText)
            .join('와 ')
        this.message = `${operandsText}로는 ${operatorToText(
            props.resource.operator,
        )} 작업을 수행할 수 없습니다.`
    }
}

export class RangeStartMustBeIntegerError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            start: ValueType
        }
    }) {
        super(props)

        const startText = valueTypeToText(props.resource.start)
        this.message = `범위의 시작은 정수여야 해요. ${startText}는 정수가 아니에요.`
    }
}

export class RangeEndMustBeIntegerError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            end: ValueType
        }
    }) {
        super(props)

        const endText = valueTypeToText(props.resource.end)
        this.message = `범위의 끝은 정수여야 해요. ${endText}는 정수가 아니에요.`
    }
}

export class NotBooleanTypeError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            value: ValueType
        }
    }) {
        super(props)

        const valueText = valueTypeToText(props.resource.value)
        this.message = `참/거짓(Boolean) 타입이어야 해요. 하지만 ${valueText}가 왔어요.`
    }
}

export class FormulaStackUnderflowError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            formula: Formula
        }
    }) {
        super(props)

        this.message = `계산식을 계산하는 중에 문제가 발생했어요. 연산할 값이 부족해요.`
    }
}

export class InvalidFormulaError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            formula: Formula
        }
    }) {
        super(props)

        this.message = `계산식이 올바르지 않아요. 계산이 끝났는데 값이 남았거나 부족해요.`
    }
}
