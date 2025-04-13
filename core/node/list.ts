import { TargetIsNotIndexedValueError } from '../error/indexed.ts'
import { ListIndexTypeError } from '../error/indexed.ts'

import { Scope } from '../executer/scope.ts'
import { ValueType } from '../value/base.ts'
import { IndexedValue } from '../value/indexed.ts'
import { ListValue } from '../value/list.ts'
import { NumberValue, StringValue } from '../value/primitive.ts'
import { Evaluable, Executable, Node } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import { YaksokError } from '../error/common.ts'
import { NotExecutableNodeError } from '../error/unknown-node.ts'

export class Sequence extends Node {
    static override friendlyName = '나열된 값'

    constructor(public items: Evaluable[], public override tokens: Token[]) {
        super()
    }

    override validate() {
        return [
            new NotExecutableNodeError({
                tokens: this.tokens,
                resource: {
                    node: this,
                },
            }),
        ]
    }
}

export class ListLiteral extends Evaluable {
    static override friendlyName = '목록'

    constructor(public items: Evaluable[], public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<ListValue> {
        const evaluatedItems = await Promise.all(
            this.items.map((item) => item.execute(scope)),
        )

        const value = new ListValue(evaluatedItems)
        return value
    }

    override validate(scope: Scope) {
        const errors = this.items
            .flatMap((item) => item.validate(scope))
            .filter((error): error is YaksokError => !!error)

        return errors
    }
}

export class IndexFetch extends Evaluable {
    static override friendlyName = '사전에서 값 가져오기'

    constructor(
        public list: Evaluable<IndexedValue>,
        public index: Evaluable<StringValue | NumberValue | ListValue>,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const list = await this.list.execute(scope)
        const index = await this.index.execute(scope)

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                tokens: this.tokens,
                resource: {
                    target: list,
                },
            })
        }

        if (index instanceof ListValue) {
            const values = list.getItemsFromKeys(index)
            return values
        }

        try {
            const value = list.getItem(index.value)
            return value
        } catch (error) {
            if (error instanceof YaksokError && !error.tokens) {
                if (error instanceof ListIndexTypeError) {
                    error.tokens = this.index.tokens
                } else {
                    error.tokens = this.tokens
                }
            }

            throw error
        }
    }

    public async setValue(
        scope: Scope,

        value: ValueType,
    ) {
        const list = await this.list.execute(scope)
        const index = await this.index.execute(scope)

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                tokens: this.tokens.slice(0, -1),
                resource: {
                    target: list,
                },
            })
        }

        if (
            !(index instanceof NumberValue) &&
            !(index instanceof StringValue)
        ) {
            throw new ListIndexTypeError({
                tokens: this.tokens,
                resource: {
                    index: index.toPrint(),
                },
            })
        }

        list.setItem(index.value, value)
    }

    override validate(scope: Scope) {
        const errors = [
            ...(this.list.validate(scope) || []),
            ...(this.index.validate(scope) || []),
        ]

        return errors
    }
}

export class SetToIndex extends Executable {
    static override friendlyName = '목록에 값 넣기'

    constructor(
        public target: IndexFetch,
        public value: Evaluable,
        public override tokens: Token[],
    ) {
        super()

        this.position = target.position
    }

    override async execute(scope: Scope): Promise<void> {
        const value = await this.value.execute(scope)
        await this.target.setValue(scope, value)
    }

    override validate(scope: Scope) {
        const errors = [
            ...(this.target.validate(scope) || []),
            ...(this.value.validate(scope) || []),
        ]

        return errors
    }
}
