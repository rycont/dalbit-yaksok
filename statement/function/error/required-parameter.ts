import { blue, bold, Scope, Token, YaksokError } from '@dalbit-yaksok/core'

export class RequiredParametersShouldPriorError extends YaksokError {
    constructor(props: { scope: Scope; tokens: Token[] }) {
        super(props)

        this.message = `약속의 필수 값은 선택 값보다 앞에 있어야 해요. ${bold(blue(props.tokens.map((t) => t.value).join('')))}의 순서를 앞으로 옮겨주세요.`
    }
}
