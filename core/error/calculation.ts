import { Operator } from '../node/base.ts'
import { operatorToText, valueTypeToText, YaksokError } from './common.ts'

import type { Position } from '../type/position.ts'
import { ValueType } from '../value/base.ts'
import { Token } from '../prepare/tokenize/token.ts'

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
