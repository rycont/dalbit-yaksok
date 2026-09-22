import type { Scope } from '../executer/scope.ts'
import type { Evaluable, Expression, Node, Operator } from '../node/base.ts'
import { Token, TOKEN_TYPE_TO_TEXT } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'
import { bold, blue, dim } from '../util/terminal.ts'
import { ValueType } from '../value/base.ts'

export class YaksokError<T = unknown> extends Error {
    position?: Position
    tokens?: Token[]
    resource: T
    child?: YaksokError
    scope?: Scope
    node?: Node

    constructor(props: {
        node?: Node
        scope?: Scope
        position?: Position
        tokens?: Token[]
    })
    constructor(props: {
        node?: Node
        scope?: Scope
        position?: Position
        resource: T
        tokens?: Token[]
    })
    constructor(props: {
        node?: Node
        scope?: Scope
        position?: Position
        resource?: T
        tokens?: Token[]
    }) {
        super()

        this.position = props.position
        this.resource = (props.resource ?? null) as T
        this.tokens = props.tokens
        this.scope = props.scope
        this.node = props.node
    }
}

export function evaluableToText(evaluable: Evaluable) {
    let text = (evaluable.constructor as typeof Evaluable).friendlyName

    try {
        text = bold(blue(evaluable.toPrint())) + dim(`(${text})`)
    } catch {
        // If toPrint() is not implemented, ignore
    }

    return text
}

export function valueTypeToText(valueType: ValueType) {
    return (
        bold(blue(valueType.toPrint())) +
        dim(`(${(valueType.constructor as typeof ValueType).friendlyName})`)
    )
}

export function operatorToText(operator: Operator) {
    let text = (operator.constructor as typeof Operator).friendlyName

    const toPrint = operator.toPrint()
    if (toPrint !== 'unknown') text = blue(bold(toPrint)) + dim(`(${text})`)

    return text
}

export function tokenToText(token: Token) {
    const type = TOKEN_TYPE_TO_TEXT[token.type]
    const text = token.value.replace('\n', dim('줄바꿈'))
    return `${bold(`'${text}'`)}${dim(`(${type})`)}`
}

export function expressionToText(node: Expression) {
    return `${bold(blue(node.toPrint()))}${dim(
        `(${(node.constructor as typeof Expression).friendlyName})`,
    )}`
}
