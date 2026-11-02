import {
    blue,
    bold,
    dim,
    Mention,
    Scope,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class UnknownNodeError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)

        this.message = '올바르지 않은 코드에요. 문법을 다시 확인해주세요.'
    }
}

export class NotExecutableNodeError extends YaksokError {
    constructor(props: { tokens: Token[]; scope: Scope; node: Node }) {
        super(props)
        this.scope = props.scope

        const tokenText = props.tokens
            .map((t) => t.value)
            .join('')
            .replace('\n', '\\n')
        const nodeName = (props.node.constructor as typeof Node).friendlyName

        this.message = `${blue(bold('"' + tokenText + '"'))}${dim(
            `(${nodeName})`,
        )}은 실행할 수 없는 코드예요.`
    }
}

export class IncompleteMentionError extends YaksokError {
    constructor(props: { tokens: Token[]; node: Mention; scope: Scope }) {
        super(props)

        this.message = `${blue(
            bold('@' + props.node.value),
        )}은 실행할 수 없어요. 이 뒤에 불러올 변수나 함수 이름을 적어주세요.`
    }
}
