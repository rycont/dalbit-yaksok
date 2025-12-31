import { YaksokError } from '../error/common.ts'
import { InvalidTypeCastError } from '../error/typecast.ts'
import { Evaluable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import {
    StringValue,
    NumberValue,
    BooleanValue,
} from '../value/primitive.ts'

export type TypeCastTarget = '숫자' | '문자열' | '참거짓'

const TRUTHY_STRINGS = new Set(['참', 'true', '맞음'])
const FALSY_STRINGS = new Set(['거짓', 'false', '아님'])

export class TypeCast extends Evaluable {
    static override friendlyName = '형변환'

    constructor(
        public value: Evaluable,
        public targetType: TypeCastTarget,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const evaluated = await this.value.execute(scope)

        switch (this.targetType) {
            case '숫자':
                return this.castToNumber(evaluated)
            case '문자열':
                return this.castToString(evaluated)
            case '참거짓':
                return this.castToBoolean(evaluated)
        }
    }

    private castToNumber(value: ValueType): NumberValue {
        if (value instanceof NumberValue) {
            return value
        }

        if (value instanceof StringValue) {
            const parsed = parseFloat(value.value)
            if (isNaN(parsed)) {
                throw new InvalidTypeCastError({
                    tokens: this.tokens,
                    resource: { value, targetType: this.targetType },
                })
            }
            return new NumberValue(parsed)
        }

        if (value instanceof BooleanValue) {
            return new NumberValue(value.value ? 1 : 0)
        }

        throw new InvalidTypeCastError({
            tokens: this.tokens,
            resource: { value, targetType: this.targetType },
        })
    }

    private castToString(value: ValueType): StringValue {
        return new StringValue(value.toPrint())
    }

    private castToBoolean(value: ValueType): BooleanValue {
        if (value instanceof BooleanValue) {
            return value
        }

        if (value instanceof StringValue) {
            const lower = value.value.toLowerCase()
            if (TRUTHY_STRINGS.has(lower)) return new BooleanValue(true)
            if (FALSY_STRINGS.has(lower)) return new BooleanValue(false)
            return new BooleanValue(value.value.length > 0)
        }

        if (value instanceof NumberValue) {
            return new BooleanValue(value.value !== 0)
        }

        return new BooleanValue(true)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}
