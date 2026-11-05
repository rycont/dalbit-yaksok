import { Node, Scope, Token } from '@dalbit-yaksok/core'
import { bold, blue, dim } from '../util/terminal.ts'

import { YaksokError } from './common.ts'

export class CannotReturnOutsideFunctionError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `"약속 그만"은 약속 안에서만 사용할 수 있어요.`
    }
}

export class AlreadyDefinedFunctionError extends YaksokError {
    constructor(props: { resource: { name: string }; scope: Scope }) {
        super(props)
        this.message = `이미 ${bold(
            blue(`"${props.resource.name}"`),
        )}라는 약속(번역)이 있어요`

        this.scope = props.scope
    }
}

export class CallStackDepthExceededError extends YaksokError<
    { limit: number; depth: number } | undefined
> {
    constructor(props: {
        tokens?: Token[]
        resource: { limit: number; depth: number }
    }) {
        super(props)
        const { limit } = props.resource
        this.message = `약속을 너무 깊이 호출했어요. 약속 호출은 최대 ${limit}단계까지만 허용돼요.`
    }
}

export class UnexpectedArgumentError extends YaksokError<{
    names: string[]
}> {
    constructor(props: {
        tokens?: Token[]
        resource: { names: string[] }
        scope: Scope
    }) {
        super(props)
        const { names } = props.resource
        this.message = `이 약속은 ${names
            .map((name) => bold(blue(name)))
            .join(dim(', '))}이라는 값을 이해할 수 없어요.`
    }
}
