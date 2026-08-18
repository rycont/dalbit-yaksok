import type { Token } from '../prepare/tokenize/token.ts'

import { blue, bold, dim, YaksokError } from './common.ts'

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

export class UnexpectedArgumentError extends YaksokError<{
    names: string[]
}> {
    constructor(props: { tokens?: Token[]; resource: { names: string[] } }) {
        super(props)
        const { names } = props.resource
        this.message = `이 약속은 ${names
            .map((name) => bold(blue(name)))
            .join(dim(', '))}이라는 값을 이해할 수 없어요.`
    }
}

export class MissingRequiredArgumentError extends YaksokError<{
    names: string[]
}> {
    constructor(props: { tokens?: Token[]; resource: { names: string[] } }) {
        super(props)
        const { names } = props.resource
        this.message = `이 약속엔 ${names
            .map((name) => bold(blue(name)))
            .join(dim(', '))} 값이 꼭 필요해요.`
    }
}

export class TooManyArgumentsError extends YaksokError<{
    expectedMax: number
    given: number
}> {
    constructor(props: {
        resource: {
            expectedMax: number
            given: number
        }
        tokens: Token[]
    }) {
        super(props)

        this.message = `주어진 값이 너무 많아요. ${bold(
            blue(props.resource.expectedMax) + '개',
        )} 까지만 받을 수 있는데 ${bold(
            blue(props.resource.given) + '개',
        )}나 들어왔어요.`
    }
}

export class RequiredParametersShouldPriorError extends YaksokError<{
    name: string
}> {
    constructor(props: { resource: { name: string }; tokens: Token[] }) {
        super(props)

        this.message = `약속의 필수 값은 선택 값보다 앞에 있어야 해요. ${bold(blue(props.resource.name))} 인자를 앞으로 옮겨주세요.`
    }
}
