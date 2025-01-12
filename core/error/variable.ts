import { tokenToText, YaksokError } from './common.ts'

import type { Token } from '../prepare/tokenize/token.ts'

export class CannotUseReservedWordForIdentifierNameError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `${tokenToText(
            props.tokens[0],
        )}는 변수나 약속의 이름으로 사용할 수 없어요.`
    }
}

interface NotDefinedIdentifierErrorResource {
    name: string
}

export class NotDefinedIdentifierError extends YaksokError<NotDefinedIdentifierErrorResource> {
    constructor(props: {
        resource: NotDefinedIdentifierErrorResource
        tokens: Token[]
    }) {
        super(props)
    }

    override get message(): string {
        const name =
            this.tokens?.map((token) => token.value).join('') ||
            this.resource?.name
        return `${name}라는 변수나 약속을 찾을 수 없어요`
    }
}
