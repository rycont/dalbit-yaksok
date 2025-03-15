import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import type { Scope } from '../executer/scope.ts'
import { UnknownNodeError } from '../error/unknown-node.ts'

export class Node {
    [key: string]: unknown
    tokens: Token[] = []

    static friendlyName = '노드'

    toJSON(): object {
        return {
            type: this.constructor.name,
            ...this,
        }
    }

    toPrint(): string {
        throw new Error(`${this.constructor.name} has no toPrint method`)
    }
}

export class Executable extends Node {
    static override friendlyName = '실행 가능한 노드'

    execute(_scope: Scope): Promise<unknown> {
        throw new Error(`${this.constructor.name} has no execute method`)
    }

    override toPrint(): string {
        throw new Error(`${this.constructor.name} has no toPrint method`)
    }
}

export class Evaluable<T extends ValueType = ValueType> extends Executable {
    static override friendlyName = '값이 있는 노드'

    override execute(_scope: Scope): Promise<T> {
        throw new Error(`${this.constructor.name} has no execute method`)
    }
}

export class Identifier extends Evaluable {
    static override friendlyName = '식별자'

    constructor(public value: string, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return this.value
    }

    override async execute(scope: Scope): Promise<ValueType> {
        try {
            return scope.getVariable(this.value)
        } catch (e) {
            if (e instanceof NotDefinedIdentifierError) {
                try {
                    const functionObject = scope.getFunctionObject(this.value)
                    const functionResult = await functionObject.run({})

                    assertValidReturnValue(this, functionResult)

                    return functionResult
                } catch (e) {
                    if (e instanceof NotDefinedIdentifierError) {
                        e.tokens = this.tokens
                    }

                    throw e
                }
            }

            throw e
        }
    }
}

export class Operator extends Node implements OperatorNode {
    static override friendlyName = '연산자'

    constructor(public value: string | null, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return 'unknown'
    }

    call(..._operands: ValueType[]): ValueType {
        throw new Error(`${this.constructor.name} has no call method`)
    }
}

export interface OperatorNode {
    call(...operands: ValueType[]): ValueType
}

export type OperatorClass = {
    new (...args: any[]): OperatorNode
}

export class Expression extends Node {
    static override friendlyName = '표현식'

    constructor(public value: string, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return this.value
    }
}

export class UnknownNode extends Executable {
    static override friendlyName = '알 수 없는 노드'

    constructor(public value: string, public override tokens: Token[]) {
        super()
    }

    override execute(): Promise<never> {
        throw new UnknownNodeError({
            tokens: this.tokens,
        })
    }
}
