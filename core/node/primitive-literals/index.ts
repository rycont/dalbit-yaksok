import {
    BooleanValue,
    Evaluable,
    NumberValue,
    Scope,
    Token,
    YaksokError,
    EmptyValue,
} from '@dalbit-yaksok/core'

export { StringStaticPart, StringInterpolationPart } from './string.ts'

export class NumberLiteral extends Evaluable<unknown, NumberValue> {
    static override friendlyName = '숫자'

    constructor(
        private content: number,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(_scope: Scope): Promise<NumberValue> {
        return Promise.resolve(new NumberValue(this.content))
    }

    override toPrint(): string {
        return this.content.toString()
    }

    toNumber(): number {
        return this.content
    }

    override validate(): YaksokError[] {
        return []
    }
}
export class BooleanLiteral extends Evaluable {
    static override friendlyName = '참거짓'

    constructor(
        private content: boolean,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(_scope: Scope): Promise<BooleanValue> {
        return Promise.resolve(new BooleanValue(this.content))
    }

    override toPrint(): string {
        return this.content ? '참' : '거짓'
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class EmptyLiteral extends Evaluable {
    static override friendlyName = '비어있음'

    constructor(public override tokens: Token[] = []) {
        super()
    }

    override toPrint(): string {
        return EmptyLiteral.friendlyName
    }

    override execute(_scope: Scope): Promise<EmptyValue> {
        return Promise.resolve(new EmptyValue())
    }

    override validate(): YaksokError[] {
        return []
    }
}
