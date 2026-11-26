import {
    YaksokError,
    Token,
    Scope,
    bold,
    blue,
    Statement,
} from '@dalbit-yaksok/core'

export class FunctionMustHaveSignature extends YaksokError {
    constructor(props: {
        tokens: Token[]
        scope: Scope
        statement: Statement
    }) {
        super(props)
        this.message = `반점(${bold(blue(','))}) 뒤에 이 약속의 이름을 적어주세요`
    }
}
