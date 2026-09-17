import type { YaksokError } from '../error/common.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { IndexedValue } from '../value/indexed.ts'
import { Evaluable, Expression } from './base.ts'

export class KeyValuePair extends Expression<Evaluable> {
    static override friendlyName = '키-값 쌍'

    constructor(
        public key: string | number,
        entry: Evaluable,
        public override tokens: Token[] = [],
    ) {
        super(String(key), tokens)
        this.subnode = entry
    }
}

export class KeyValuePairSequence extends Expression<KeyValuePair[]> {
    static override friendlyName = '키-값 쌍 목록'

    constructor(
        pairs: KeyValuePair[],
        public override tokens: Token[] = [],
    ) {
        super('키-값 쌍 목록', tokens)
        this.subnode = pairs
    }
}

export class DictLiteral extends Evaluable<KeyValuePair[]> {
    static override friendlyName = '사전'

    constructor(
        pairs: KeyValuePair[],
        public override tokens: Token[] = [],
    ) {
        super()
        this.subnode = pairs
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.subnode.flatMap((pair) =>
            pair.subnode.validate(scope),
        )

        return errors
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const evaluatedEntries = new Map(
            await Promise.all(
                this.subnode.map(
                    async (pair) =>
                        [pair.key, await pair.subnode.execute(scope)] as const,
                ),
            ),
        )

        const value = new IndexedValue(evaluatedEntries)
        return value
    }
}
