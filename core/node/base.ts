import type { CallFrame } from '../executer/callFrame.ts'
import type { Scope } from '../executer/scope.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'
import { ValueType } from '../value/base.ts'
import { Token } from '../prepare/tokenize/token.ts'

export class Node {
    [key: string]: unknown
    tokens?: Token[]

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

    execute(_scope: Scope, _callFrame: CallFrame): Promise<unknown> {
        throw new Error(`${this.constructor.name} has no execute method`)
    }

    override toPrint(): string {
        throw new Error(`${this.constructor.name} has no toPrint method`)
    }
}

export class Evaluable<T extends ValueType = ValueType> extends Executable {
    static override friendlyName = '값이 있는 노드'

    override execute(_scope: Scope, _callFrame: CallFrame): Promise<T> {
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

    override execute(scope: Scope, _callFrame: CallFrame): Promise<ValueType> {
        try {
            return Promise.resolve(scope.getVariable(this.value))
        } catch (e) {
            if (e instanceof NotDefinedIdentifierError) {
                e.position = this.tokens?.[0].position
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
