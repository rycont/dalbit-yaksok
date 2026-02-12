import { YaksokError } from '../error/common.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { NumberValue, StringValue } from '../value/primitive.ts'
import { Evaluable } from './base.ts'

const BASE_KEYWORD_TO_RADIX: Record<string, number> = {
    이진수: 2,
    팔진수: 8,
    십진수: 10,
    십육진수: 16,
    '2진수': 2,
    '8진수': 8,
    '10진수': 10,
    '16진수': 16,
}

export function resolveRadix(baseKeyword: string): number | null {
    return BASE_KEYWORD_TO_RADIX[baseKeyword] ?? null
}

export class UnaryBitwiseNot extends Evaluable {
    static override friendlyName = '비트 반전(~)'

    constructor(
        public value: Evaluable,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<NumberValue> {
        const evaluated = await this.value.execute(scope)

        if (!(evaluated instanceof NumberValue)) {
            throw new Error('비트 반전(~)은 숫자에만 사용할 수 있습니다.')
        }

        return new NumberValue(~evaluated.value)
    }

    override toPrint(): string {
        return `~${this.value.toPrint()}`
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}

export class RadixFormatValue extends Evaluable {
    static override friendlyName = '진수 변환 값'

    constructor(
        public value: Evaluable,
        public baseKeyword: string,
        public digits: number | null,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<StringValue> {
        const evaluated = await this.value.execute(scope)

        if (!(evaluated instanceof NumberValue)) {
            throw new Error('진수 변환은 숫자 값에만 사용할 수 있습니다.')
        }

        const radix = resolveRadix(this.baseKeyword)

        if (!radix) {
            throw new Error(`알 수 없는 진수: ${this.baseKeyword}`)
        }

        const raw = convertToRadixString(evaluated.value, radix, this.digits)

        return new StringValue(raw)
    }

    override toPrint(): string {
        const digitText = this.digits ? ` ${this.digits}자리로` : ''
        return `${this.value.toPrint()}의 ${this.baseKeyword} 값${digitText}`
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}

function convertToRadixString(value: number, radix: number, digits: number | null): string {
    if (!Number.isInteger(value)) {
        return value.toString()
    }

    if (!digits || digits <= 0) {
        return value.toString(radix)
    }

    if (radix === 10) {
        if (value < 0) {
            return value.toString(10)
        }

        return value.toString(10).padStart(digits, '0')
    }

    const bitWidth = radix === 2 ? digits : radix === 8 ? digits * 3 : digits * 4
    const normalized = value & ((1 << bitWidth) - 1)

    return normalized.toString(radix).padStart(digits, '0')
}
