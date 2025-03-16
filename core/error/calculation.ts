import { Operator } from '../node/base.ts'
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

        this.message = `${leftText}와 ${rightText}는 비교할 수 없어요.`
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
        this.message = `${operandsText}는 ${operatorToText(
            props.resource.operator,
        )}할 수 없어요.`
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
