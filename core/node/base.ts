import { NotDefinedIdentifierError } from '../error/variable.ts'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'

import { YaksokError } from '../error/common.ts'
import { NotExecutableNodeError } from '../error/unknown-node.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'

export class Node {
    [key: string]: unknown
    tokens: Token[] = []

    static friendlyName = '노드'

    validate(_scope: Scope): YaksokError[] {
        throw new Error(`${this.constructor.name} has no validate method`)
    }

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

    protected async onRunChild(scope: Scope, childTokens: Token[]) {
        const executionDelay = scope.codeFile?.executionDelay

        if (executionDelay) {
            await new Promise((r) => setTimeout(r, executionDelay))
        }

        if (scope.codeFile?.session?.paused) {
            await new Promise((resolve) => {
                const unsubscribe = scope.codeFile?.session?.pubsub.sub(
                    'resume',
                    () => {
                        resolve(undefined)
                        if (unsubscribe) {
                            unsubscribe()
                        }
                    },
                )
            })
        }

        if (childTokens.length) {
            this.reportRunningCode(childTokens, scope)
        }
    }

    private reportRunningCode(childTokens: Token[], scope: Scope) {
        const startPosition = childTokens[0].position
        const endToken = childTokens[childTokens.length - 1]
        const endPosition = {
            line: endToken.position.line,
            column: endToken.position.column + endToken.value.length,
        }

        scope.codeFile?.session?.pubsub.pub('runningCode', [
            {
                line: startPosition.line,
                column: startPosition.column,
            },
            endPosition,
            scope,
            childTokens,
        ])
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

    override validate(scope: Scope): YaksokError[] {
        try {
            scope.getVariable(this.value)
            return []
        } catch (variableError) {
            if (!(variableError instanceof YaksokError)) {
                throw variableError
            }

            if (!(variableError instanceof NotDefinedIdentifierError)) {
                variableError.tokens = this.tokens
                return [variableError]
            }

            try {
                scope.getFunctionObject(this.value)
                return []
            } catch (functionError) {
                if (!(functionError instanceof YaksokError)) {
                    throw functionError
                }
            }

            variableError.tokens = this.tokens
            return [variableError]
        }
    }
}

export class Operator extends Node implements OperatorNode {
    static override friendlyName = '연산자'

    constructor(public value: string | null, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return this.value ?? '알 수 없음'
    }

    call(..._operands: ValueType[]): ValueType {
        throw new Error(`${this.constructor.name} has no call method`)
    }

    override validate(): YaksokError[] {
        return []
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

    override validate(): YaksokError[] {
        const error = new NotExecutableNodeError({
            tokens: this.tokens,
            resource: { node: this },
        })

        return [error]
    }
}
