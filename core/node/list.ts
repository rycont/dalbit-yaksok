import { TargetIsNotIndexedValueError } from '../error/indexed.ts'
import { ListIndexTypeError } from '../error/indexed.ts'
import { CallFrame } from '../executer/callFrame.ts'
import { Scope } from '../executer/scope.ts'
import { ValueType } from '../value/base.ts'
import { IndexedValue } from '../value/indexed.ts'
import { ListValue } from '../value/list.ts'
import { NumberValue, StringValue } from '../value/primitive.ts'
import { Evaluable, Executable, Node } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'

export class Sequence extends Node {
    static override friendlyName = '나열된 값'

    constructor(public items: Evaluable[], public override tokens: Token[]) {
        super()
    }
}

export class ListLiteral extends Evaluable {
    static override friendlyName = '목록'

    constructor(public items: Evaluable[], public override tokens: Token[]) {
        super()
    }

    override async execute(
        scope: Scope,
        callFrame: CallFrame,
    ): Promise<ListValue> {
        const evaluatedItems = await Promise.all(
            this.items.map((item) => item.execute(scope, callFrame)),
        )

        const value = new ListValue(evaluatedItems)
        return value
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

    override async execute(
        scope: Scope,
        callFrame: CallFrame,
    ): Promise<ValueType> {
        const list = await this.list.execute(scope, callFrame)
        const index = await this.index.execute(scope, callFrame)

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                position: this.tokens[0].position,
                resource: {
                    target: list,
                },
            })
        }

        if (index instanceof ListValue) {
            const values = list.getItemsFromKeys(index)
            return values
        }

        const value = list.getItem(index.value)
        return value
    }

    public async setValue(
        scope: Scope,
        callFrame: CallFrame,
        value: ValueType,
    ) {
        const list = await this.list.execute(scope, callFrame)
        const index = await this.index.execute(scope, callFrame)

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                position: this.tokens[0].position,
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
                position: this.tokens[0].position,
                resource: {
                    index: index.toPrint(),
                },
            })
        }

        list.setItem(index.value, value)
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

    override async execute(scope: Scope, callFrame: CallFrame): Promise<void> {
        const value = await this.value.execute(scope, callFrame)
        await this.target.setValue(scope, callFrame, value)
    }
}
