import { StringValue } from '@dalbit-yaksok/core'

export class ValueType {
    static friendlyName = '값'

    toPrint(): string {
        return `${(this.constructor as typeof ValueType).friendlyName} (${JSON.stringify(
            this,
        )})`
    }

    public toStringValue(): StringValue {
        return new StringValue(this.toPrint())
    }
}

export class PrimitiveValue<T = unknown> extends ValueType {
    constructor(public value: T) {
        super()
    }
}

export class ObjectValue extends ValueType {
    static override friendlyName = '객체'

    override toPrint(): string {
        return JSON.stringify(this)
    }
}
