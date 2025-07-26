import { YaksokError } from '../error/common.ts'
import { NotEnumerableValueForListLoopError } from '../error/index.ts'
import { BreakSignal } from '../executer/signals.ts'
import { Executable, type Evaluable } from './base.ts'

import { Scope } from '../executer/scope.ts'
import { ListValue } from '../value/list.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'
import type { Block } from './block.ts'

export class ListLoop extends Executable {
    static override friendlyName = '목록 반복'

    constructor(
        public list: Evaluable,
        public variableName: string,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(_scope: Scope): Promise<void> {
        const scope = new Scope({
            parent: _scope,
        })

        const list = await this.list.execute(scope)

        this.assertRepeatTargetIsList(list)

        try {
            for (const value of list.enumerate()) {
                await this.onRunChild({
                    scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                scope.setVariable(this.variableName, value)
                await this.body.execute(scope)
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    assertRepeatTargetIsList(target: ValueType): asserts target is ListValue {
        if (target instanceof ListValue) return

        throw new NotEnumerableValueForListLoopError({
            resource: {
                value: target,
            },
            tokens: this.list.tokens,
        })
    }

    override validate(scope: Scope): YaksokError[] {
        const listScope = new Scope({
            parent: scope,
            initialVariable: {
                [this.variableName]: new NumberValue(0),
            },
        })

        const listErrors = this.list.validate(scope)
        const bodyErrors = this.body.validate(listScope)

        return [...listErrors, ...bodyErrors]
    }
}
