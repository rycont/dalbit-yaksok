import type { Token } from '../prepare/tokenize/token.ts'

import { YaksokError, blue, bold } from './common.ts'

export class CannotReturnOutsideFunctionError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `"약속 그만"은 약속 안에서만 사용할 수 있어요.`
    }
}

export class FunctionMustHaveOneOrMoreStringPartError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `약속(번역)을 선언할 때엔 적어도 하나의 고정되는 부분이 있어야 해요.`
    }
}

export class AlreadyDefinedFunctionError extends YaksokError {
    constructor(props: { resource: { name: string } }) {
        super(props)
        this.message = `이미 ${bold(
            blue(`"${props.resource.name}"`),
        )}라는 약속(번역)이 있어요`
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
