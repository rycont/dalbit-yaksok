import { BooleanValue, NumberValue, StringValue } from '../value/primitive.ts'
import { Evaluable, Node } from './base.ts'
import { YaksokError } from '../error/common.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class NumberLiteral extends Evaluable {
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

export class StringLiteral extends Evaluable {
    static override friendlyName = '문자'

    constructor(
        private content: string,
        public override tokens: Token[],
    ) {
        super()
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

export class TemplateStringPart extends Node {
    static override friendlyName = '템플릿 문자열 부분'

    constructor(
        public content: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override toPrint(): string {
        return this.content
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class TemplateLiteral extends Evaluable {
    static override friendlyName = '템플릿 문자열'

    constructor(
        public parts: (TemplateStringPart | Evaluable)[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<StringValue> {
        const results: string[] = []

        for (const part of this.parts) {
            if (part instanceof TemplateStringPart) {
                results.push(part.content)
            } else {
                const value = await part.execute(scope)
                results.push(value.toPrint())
            }
        }

        return new StringValue(results.join(''))
    }

    override toPrint(): string {
        return this.parts.map((p) => p.toPrint()).join('')
    }

    override validate(scope: Scope): YaksokError[] {
        return this.parts
            .filter((part) => part instanceof Evaluable)
            .flatMap((part) => (part as Evaluable).validate(scope))
    }
}
