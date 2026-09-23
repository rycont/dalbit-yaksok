import {
    NotDefinedIdentifierError,
    Scope,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'

import { NotExecutableNodeError } from '../error/unknown-node.ts'
import { AbortedSessionSignal } from '../executer/signals.ts'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { printTree } from '../util/print-ast.ts'

export enum NodeCapability {
    LOOP_CONTROL = 'LOOP_CONTROL',
    RETURN = 'RETURN',
}

export type SubnodeScheme = Record<string, Node> | Node[] | Node | unknown

export class Node<SubnodeShape extends SubnodeScheme = unknown> {
    tokens: Token[] = []

    public subnode!: SubnodeShape
    public value?: string

    static friendlyName = '노드'
    static accepts: NodeCapability[] = []

    constructor() {}

    validate(_scope: Scope): YaksokError[] {
        throw new Error(`${this.getNodeTypeName()} has no validate method`)
    }

    toPrint(): string {
        throw new Error(`${this.getNodeTypeName()} has no toPrint method`)
    }

    protected getNodeTypeName(): string {
        return (this.constructor as typeof Node).friendlyName || '노드'
    }

    [Symbol.for('Deno.customInspect')](): string {
        return printTree(this)
    }
}

export class Executable<T extends SubnodeScheme = unknown> extends Node<T> {
    static override friendlyName = '실행 가능한 노드'

    execute(_scope: Scope): Promise<unknown> {
        throw new Error(`${this.getNodeTypeName()} has no execute method`)
    }

    override toPrint(): string {
        throw new Error(`${this.getNodeTypeName()} has no toPrint method`)
    }

    protected async onRunChild({
        scope,
        childTokens,
        skipReport = false,
    }: {
        scope: Scope
        childTokens: Token[]
        skipReport?: boolean
    }) {
        if (!scope.session) {
            return
        }

        if (scope.session.signal?.aborted) {
            throw new AbortedSessionSignal(childTokens)
        }

        await scope.session.tick()

        if (!skipReport && childTokens.length) {
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

        scope.session?.pubsub.pub('runningCode', [
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

export class Evaluable<
    LeavesType extends SubnodeScheme = unknown,
    T extends ValueType = ValueType,
> extends Executable<LeavesType> {
    static override friendlyName = '값이 있는 노드'

    override execute(_scope: Scope): Promise<T> {
        throw new Error(`${this.getNodeTypeName()} has no execute method`)
    }
}

export class Identifier extends Evaluable {
    static override friendlyName = '식별자'

    constructor(
        public override value: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override toPrint(): string {
        return this.value
    }

    override async execute(scope: Scope): Promise<ValueType> {
        try {
            return scope.getVariable(this.value, this.tokens)
        } catch (e) {
            if (e instanceof NotDefinedIdentifierError) {
                try {
                    const functionObject = scope.getFunctionObject(this.value)
                    const functionResult = await functionObject.run({})

                    assertValidReturnValue(
                        functionResult,
                        this.tokens,
                        functionObject.name,
                    )

                    return functionResult
                } catch (e2) {
                    if (e2 instanceof NotDefinedIdentifierError) {
                        e2.tokens = this.tokens
                    }

                    throw e2
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
            variableError.scope = scope
            variableError.node = this

            return [variableError]
        }
    }
}

export class Operator extends Node implements OperatorNode {
    static override friendlyName = '연산자'

    constructor(
        public override value: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override toPrint(): string {
        return this.value
    }

    async call(
        _left: () => Promise<ValueType>,
        _right: () => Promise<ValueType>,
    ): Promise<ValueType> {
        throw new Error(`${this.getNodeTypeName()} has no call method`)
    }

    override validate(): YaksokError[] {
        return []
    }
}

export interface OperatorNode {
    call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<ValueType>
}

export type OperatorClass = {
    new (...args: any[]): OperatorNode
}

export class Expression<
    LeavesType extends SubnodeScheme = unknown,
> extends Node<LeavesType> {
    static override friendlyName = '표현식'

    constructor(
        public override value: string,
        public override tokens: Token[],
    ) {
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
