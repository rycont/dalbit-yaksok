import { YaksokError, Token, Scope, bold, blue, dim } from '@dalbit-yaksok/core'

export class MissingRequiredArgumentError extends YaksokError<{
    names: string[]
}> {
    constructor(props: {
        tokens: Token[]
        resource: { names: string[] }
        scope: Scope
    }) {
        super(props)
        const { names } = props.resource
        this.message = `이 약속엔 ${names
            .map((name) => bold(blue(name)))
            .join(dim(', '))} 값이 꼭 필요해요.`
    }
}
