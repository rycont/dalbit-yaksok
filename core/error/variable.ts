import { YaksokError } from './common.ts'

import { Node, Scope, Token } from '@dalbit-yaksok/core'
import { bold, blue } from '../util/terminal.ts'

export class NotProperIdentifierNameToDefineError extends YaksokError {
    constructor(props?: { tokens: Token[]; scope: Scope }) {
        super({})

        if (props) {
            this.tokens = props.tokens
            this.scope = props.scope
        }
    }

    override get message(): string {
        return `${bold(
            blue(this.tokens!.map((t) => t.value).join('')),
        )}는 변수나 약속의 이름으로 사용할 수 없어요.`
    }
}

interface NotDefinedIdentifierErrorResource {
    name: string
    suggestedFixes?: string[]
}

export class NotDefinedIdentifierError extends YaksokError<NotDefinedIdentifierErrorResource> {
    constructor(props: {
        node?: Node
        scope: Scope
        resource: NotDefinedIdentifierErrorResource
        texts?: string[]
    }) {
        super(props)
    }

    override get message(): string {
        const name =
            this.tokens?.map((token) => token.value).join(' ') ||
            this.resource.name!
        const fixes = this.resource?.suggestedFixes
        const fixHint =
            fixes && fixes.length > 0
                ? ` 아마도 ${fixes
                      .map((f) => bold(blue(`"${f}"`)))
                      .join(' 또는 ')} 일 수 있어요.`
                : ''

        return `${bold(blue(`"${name}"`))}라는 변수나 약속을 찾을 수 없어요.${fixHint}`
    }
}
