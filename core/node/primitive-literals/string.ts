import {
    Evaluable,
    Expression,
    NotAcceptableSignal,
    PlusOperator,
    RunFrame,
    Scope,
    StringValue,
    Token,
    UnexpectedCharError,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'

export class StringStaticPart extends Expression {
    static override friendlyName = '문자'

    constructor(
        public scope: Scope,
        content: string,
        tokens: Token[],
    ) {
        super(content, tokens)
    }

    override validate(): YaksokError[] {
        return this.tokens
            .filter((t) => t.value.includes('\n'))
            .map(
                () =>
                    new UnexpectedCharError({
                        scope: this.scope,
                        node: this,
                        resource: {
                            parts: '문자열',
                            char: '줄바꿈',
                        },
                    }),
            )
    }
}

export class StringPartSequence extends Evaluable<
    (StringStaticPart | Evaluable)[]
> {
    static override friendlyName = '문자'

    constructor(
        public scope: Scope,
        content: (StringStaticPart | Evaluable | Expression)[],
        public override tokens: Token[],
    ) {
        if (StringPartSequence.isBroken(content)) {
            throw new NotAcceptableSignal()
        }

        super()
        this.subnode = content
    }

    override async execute(runFrame: RunFrame): Promise<ValueType> {
        const parts = await Promise.all(
            this.subnode.slice(1, -1).map((n) => {
                if (n instanceof StringStaticPart) {
                    return Promise.resolve(new StringValue(n.value))
                }

                return n.execute(runFrame)
            }),
        )

        const result = parts.reduce<Promise<ValueType>>(
            async (acc, current) => {
                return await new PlusOperator(this.scope, []).call(
                    () => Promise.resolve(acc),
                    () => Promise.resolve(current.toStringValue()),
                )
            },
            Promise.resolve(new StringValue('')),
        )

        return result
    }

    public static isBroken(content: (Expression | Evaluable)[]): boolean {
        return content.some(
            (p, index) =>
                p instanceof Expression &&
                (p.value === "'" || p.value === '"') &&
                index !== 0 &&
                index !== content.length - 1,
        )
    }

    public override validate(): YaksokError[] {
        return this.subnode.slice(1, -1).flatMap((n) => n.validate())
    }
}
