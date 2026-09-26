import { YaksokError } from '../error/common.ts'
import { Evaluable, Executable, Node } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { StringValue } from '../value/primitive.ts'
import { ValueType } from '../value/base.ts'
import { IndentIsNotMultipleOf4Error } from '@dalbit-yaksok/core'

export class EOL extends Node {
    static override friendlyName = '줄바꿈'

    constructor(public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Indent extends Node {
    static override friendlyName = '들여쓰기'

    public size: number
    public width: number

    public parsingErrors: YaksokError[] = []

    constructor(token: Token) {
        super()

        this.tokens = [token]

        this.width = Array.from(token.value)
            .map((t) => (t === '\t' ? 4 : 1))
            .reduce((a, b) => a + b, 0)

        this.size = Math.round(this.width / 4)
    }

    override validate(scope?: Scope): YaksokError[] {
        if (this.parsingErrors) {
            for (const e of this.parsingErrors) {
                e.scope = scope
                e.tokens = this.tokens
            }

            return this.parsingErrors
        }

        if (this.width % 4 !== 0) {
            return [
                new IndentIsNotMultipleOf4Error({
                    resource: {
                        width: this.width,
                    },
                    tokens: this.tokens,
                }),
            ]
        }

        return []
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export class Print extends Executable<Evaluable> {
    static override friendlyName = '보여주기'

    constructor(
        value: Evaluable,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = value
    }

    override async execute(scope: Scope): Promise<void> {
        const printFunction = scope.session?.stdout ?? console.log
        const evaluated = await this.subnode.execute(scope)

        printFunction(evaluated.toPrint())
    }

    override validate(scope: Scope): YaksokError[] {
        return this.subnode.validate(scope)
    }
}

export class TypeOf extends Evaluable<Evaluable> {
    static override friendlyName = '값 종류'

    constructor(
        value: Evaluable,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = value
    }

    override async execute(scope: Scope): Promise<StringValue> {
        const evaluated = await this.subnode.execute(scope)

        return new StringValue(
            (evaluated.constructor as typeof ValueType).friendlyName,
        )
    }

    override validate(scope: Scope): YaksokError[] {
        return this.subnode.validate(scope)
    }
}
