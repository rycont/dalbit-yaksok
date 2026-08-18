import { PrimitiveValue } from './base.ts'

export class StringValue extends PrimitiveValue<string> {
    static override friendlyName = '문자'

    override toPrint(): string {
        return this.value
    }

    enumerate(): StringValue[] {
        return this.value.split('').map((char) => new StringValue(char))
    }
}

export class NumberValue extends PrimitiveValue<number> {
    static override friendlyName = '숫자'

    override toPrint(): string {
        return this.value.toString()
    }
}

export class BooleanValue extends PrimitiveValue<boolean> {
    static override friendlyName = '참거짓'

    override toPrint(): string {
        return this.value ? '참' : '거짓'
    }
}

export class EmptyValue extends PrimitiveValue {
    static override friendlyName = '비어있음'

    constructor() {
        super(undefined)
    }

    override toPrint(): string {
        return '비어있음'
    }
}
