import { Scope } from '../executer/scope.ts'
import { ValueType, YaksokError } from '../mod.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { IndexedValue } from '../value/indexed.ts'
import { Evaluable, Expression } from './base.ts'

export class KeyValuePair extends Expression {
    static override friendlyName = '키-값 쌍'

    constructor(
        public name: string,
        public entry: Evaluable,
        public override tokens: Token[] = [],
    ) {
        super(name, tokens)
    }

    override toString(): string {
        return `${this.key}: ${this.value}`
    }
}

export class KeyValuePairSequence extends Expression {
    static override friendlyName = '키-값 쌍 목록'

    constructor(
        public pairs: KeyValuePair[],
        public override tokens: Token[] = [],
    ) {
        super('키-값 쌍 목록', tokens)
    }

    override toString(): string {
        return this.pairs.map((pair) => pair.toString()).join(', ')
    }
}

export class DictLiteral extends Evaluable {
    static override friendlyName = '사전'

    constructor(
        private pairs: KeyValuePair[],
        public override tokens: Token[] = [],
    ) {
        super()
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.pairs.flatMap((pair) => pair.entry.validate(scope))

        return errors
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const evaluatedEntries = new Map(
            await Promise.all(
                this.pairs.map(
                    async (pair) =>
                        [pair.name, await pair.entry.execute(scope)] as const,
                ),
            ),
        )

        const value = new IndexedValue(evaluatedEntries)
        return value
    }
}
