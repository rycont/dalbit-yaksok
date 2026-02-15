import { Scope } from '../../executer/scope.ts'
import { NotDefinedIdentifierError } from '../../error/variable.ts'
import { ObjectValue, ValueType } from '../../value/base.ts'
import { Block } from '../block.ts'

export class ClassValue extends ValueType {
    static override friendlyName = '클래스'

    constructor(
        public name: string,
        public body: Block,
        public definitionScope: Scope,
        public parentClass?: ClassValue,
    ) {
        super()
    }

    override toPrint(): string {
        return `<클래스 ${this.name}>`
    }
}

export class InstanceValue extends ObjectValue {
    static override friendlyName = '인스턴스'

    public scope!: Scope
    public memberLookupRootScope!: Scope
    public classValue?: ClassValue

    constructor(public className: string) {
        super()
    }

    override toPrint(): string {
        return `<${this.className} 인스턴스>`
    }
}

export class SuperValue extends ObjectValue {
    static override friendlyName = '상위'

    constructor(
        public instance: InstanceValue,
        public scope: Scope,
    ) {
        super()
    }

    override toPrint(): string {
        return '<상위>'
    }
}

export function getInheritanceChain(classValue: ClassValue): ClassValue[] {
    const chain: ClassValue[] = []
    let cursor: ClassValue | undefined = classValue

    while (cursor) {
        chain.unshift(cursor)
        cursor = cursor.parentClass
    }

    return chain
}

export function resolveClassValueFromInstance(
    scope: Scope,
    instance: InstanceValue,
): ClassValue | undefined {
    if (instance.classValue) {
        return instance.classValue
    }

    try {
        const value = scope.getVariable(instance.className)
        if (value instanceof ClassValue) {
            return value
        }
        return undefined
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}
