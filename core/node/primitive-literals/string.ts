import {
    Evaluable,
    Scope,
    StringValue,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

// interface TemplateFixed {

// }

export class StringLiteral extends Evaluable {
    static override friendlyName = '문자'

    constructor(
        public content: string,
        public override tokens: Token[],
    ) {
        super()

        // StringLiteral.parseTemplate(content, tokens)
    }

    override execute(_scope: Scope): Promise<StringValue> {
        return Promise.resolve(new StringValue(this.content))
    }

    override toPrint(): string {
        return this.content
    }

    override validate(): YaksokError[] {
        return []
    }
}
