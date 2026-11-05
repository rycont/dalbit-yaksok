import { Token, YaksokError, Node, Scope } from '@dalbit-yaksok/core'

export class FunctionMustHaveOneOrMoreStringPartError extends YaksokError {
    constructor(props: { tokens: Token[]; scope: Scope; node: Node }) {
        super(props)
        this.message = `약속(번역)을 선언할 때엔 적어도 하나의 고정되는 부분이 있어야 해요.`
    }
}
