import { BooleanValue, NumberValue, StringValue } from '../value/primitive.ts'
import { Evaluable } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class NumberLiteral extends Evaluable {
    static override friendlyName = '숫자'

    constructor(private content: number, public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<NumberValue> {
        return Promise.resolve(new NumberValue(this.content))
    }

    override toPrint(): string {
        return this.content.toString()
    }
}

export class StringLiteral extends Evaluable {
    static override friendlyName = '문자'

    constructor(private content: string, public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<StringValue> {
        return Promise.resolve(new StringValue(this.content))
    }

    override toPrint(): string {
        return this.content
    }
}

export class BooleanLiteral extends Evaluable {
    static override friendlyName = '참거짓'

    constructor(private content: boolean, public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<BooleanValue> {
        return Promise.resolve(new BooleanValue(this.content))
    }

    override toPrint(): string {
        return this.content ? '참' : '거짓'
    }
}
