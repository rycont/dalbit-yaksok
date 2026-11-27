import {
    Scope,
    ValueType,
    YaksokError,
    type Token,
    EmptyValue,
    RunFrame,
    SlotKey,
    isRunnable,
    Runnable,
    NotDefinedIdentifierError,
    CannotParseError,
    RDRule,
    AmbiguousFormulaBoundary,
    ReferenceSlot,
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
    public tokens: Token[] = []
    public parsingErrors: YaksokError[] = []

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
            .flatMap((s) => s.parsingErrors)
            .concat([
                new CannotParseError({
                    scope: this.scope,
                    tokens: this.tokens,
                }),
            ])
    }
}

export class Identifier extends Evaluable {
    static override friendlyName = '식별자'
    public [ReferenceSlot]: SlotKey | null

    constructor(
        public scope: Scope,
        slotKey: SlotKey | null,
        public override value: string,
        public override tokens: Token[],
    ) {
        super()
        this[ReferenceSlot] = slotKey
    }

    override toPrint(): string {
        return this.value
    }

    override async execute(runFrame: RunFrame): Promise<ValueType> {
        const value = runFrame.get(this[ReferenceSlot])

        if (!isRunnable(value)) {
            return value
        }

        const functionResult =
            (await value[Runnable].run(new Map())) || new EmptyValue()

        return functionResult
    }

    override validate(): YaksokError[] {
        if (this.scope.slots.has(this[ReferenceSlot])) {
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
        return this.ambiguousTokens?.length
            ? [
                  new AmbiguousFormulaBoundary({
                      scope: this.scope,
                      tokens: this.ambiguousTokens,
                  }),
              ]
            : []
    }

    public ambiguousTokens?: Token[] | undefined
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
        return this.parsingErrors
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export class StatementCaller extends Evaluable {
    constructor(
        public scope: Scope,
        public toStatement: RDRule['factory'],
        public tokens: Token[],
    ) {
        super()
    }
}
