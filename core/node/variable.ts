import { YaksokError } from '../error/common.ts'
import { Evaluable } from './base.ts'

import { RESERVED_WORDS } from '../constant/reserved-words.ts'
import { CannotUseReservedWordForIdentifierNameError } from '../error/index.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'

export class SetVariable extends Evaluable {
    static override friendlyName = '변수 정하기'

    constructor(
        public name: string,
        public value: Evaluable,
        public override tokens: Token[],
    ) {
        super()
        this.assertValidName()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const { name, value } = this

        const result = await value.execute(scope)

        scope.setVariable(name, result)
        return result
    }

    assertValidName() {
        if (!RESERVED_WORDS.has(this.name)) return

        throw new CannotUseReservedWordForIdentifierNameError({
            tokens: this.tokens,
        })
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.value.validate(scope)
        scope.setVariable(this.name, new NumberValue(0))

        return errors
    }
}
