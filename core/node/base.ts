import {
    Scope,
    ValueType,
    YaksokError,
    NotExecutableNodeError,
    type Token,
    EmptyValue,
    Statement,
    Block,
    RunFrame,
    SlotKey,
    isRunnable,
    Runnable,
    NotDefinedIdentifierError,
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
    public scope!: Scope

    static friendlyName = '노드'
    static accepts: NodeCapability[] = []

    constructor() {}

    validate(): YaksokError[] {
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

    execute(_runFrame: RunFrame): Promise<T> {
        throw new Error(`${this.getNodeTypeName()} has no execute method`)
    }
}

export class IncompleteEvaluable extends Evaluable<Node[]> {
    public parsingErrors: YaksokError[] = []

    constructor(
        public subnode: Node[],
        public tokens: Token[],
    ) {
        super()
    }

    override validate() {
        return this.subnode
            .flatMap((s) => s.validate())
            .concat(this.parsingErrors)
    }
}

export class Identifier extends Evaluable {
    static override friendlyName = '식별자'

    constructor(
        public scope: Scope,
        public slotKey: SlotKey,
        public override value: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override toPrint(): string {
        return this.value
    }

    override async execute(runFrame: RunFrame): Promise<ValueType> {
        const value = runFrame.get(this.slotKey)

        if (!isRunnable(value)) {
            return value
        }

        const functionResult =
            (await value[Runnable].run(new Map())) || new EmptyValue()

        return functionResult
    }

    override validate(): YaksokError[] {
        if (this.scope.slots.has(this.slotKey)) {
            return []
        }

        return [
            new NotDefinedIdentifierError({
                resource: {
                    name: this.value,
                },
                scope: this.scope,
                tokens: this.tokens,
            }),
        ]
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

    override validate(): YaksokError[] {
        if (0 < this.parsingErrors.length) {
            for (const error of this.parsingErrors) {
                if (!error.scope) {
                    error.scope = this.scope
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
            scope: this.scope,
            node: this,
        })

        return [error]
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export class StatementCaller extends Evaluable {
    constructor(private statementFactory: (body: Block) => Statement) {
        super()
    }

    public toStatement(body: Block) {
        return this.statementFactory(body)
    }
}
