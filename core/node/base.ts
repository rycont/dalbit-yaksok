import {
    NotDefinedIdentifierError,
    Scope,
    ValueType,
    YaksokError,
    NotExecutableNodeError,
    assertValidReturnValue,
    type Token,
    EmptyValue,
    Statement,
    Block,
} from '@dalbit-yaksok/core'

export enum NodeCapability {
    LOOP_CONTROL = 'LOOP_CONTROL',
    RETURN = 'RETURN',
}

export type SubnodeScheme =
    | Record<string, Node>
    | Map<string, Node>
    | Node[]
    | Node
    | null

export class Node<SubnodeShape extends SubnodeScheme = SubnodeScheme> {
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
}

export class Evaluable<
    LeavesType extends SubnodeScheme = SubnodeScheme,
    T extends ValueType = ValueType,
> extends Node<LeavesType> {
    static override friendlyName = '값이 있는 노드'

    execute(_scope: Scope): Promise<T> {
        throw new Error(`${this.getNodeTypeName()} has no execute method`)
    }
}

export class IncompleteEvaluable extends Evaluable<Node[]> {
    constructor(
        public subnode: Node[],
        public tokens: Token[],
    ) {
        super()
    }

    override validate(scope: Scope) {
        return this.subnode.flatMap((s) => s.validate(scope))
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
                    const functionResult =
                        (await functionObject.run(new Map())) ||
                        new EmptyValue()

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
    LeavesType extends SubnodeScheme = SubnodeScheme,
> extends Node<LeavesType> {
    static override friendlyName = '표현식'

    public parsingErrors: YaksokError[] = []

    constructor(
        public override value: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override toPrint(): string {
        return this.value
    }

    override validate(scope: Scope): YaksokError[] {
        if (0 < this.parsingErrors.length) {
            for (const error of this.parsingErrors) {
                if (!error.scope) {
                    error.scope = scope
                }

                if (!error.node) {
                    error.node = this
                }

                if (!error.tokens) {
                    error.tokens = this.tokens
                }
            }

            return this.parsingErrors
        }

        const error = new NotExecutableNodeError({
            tokens: this.tokens,
            scope,
            node: this,
        })

        return [error]
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export class StatementCaller extends Node {
    constructor(private statementFactory: (body: Block) => Statement) {
        super()
    }

    public toStatement(body: Block) {
        return this.statementFactory(body)
    }
}
