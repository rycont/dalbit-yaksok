import {
    Evaluable,
    Expression,
    PlusOperator,
    Scope,
    StringValue,
    Token,
    ValueType,
} from '@dalbit-yaksok/core'
import { NotAcceptableSignal } from '../../prepare/parse/signal.ts'
import { UnexpectedCharError, YaksokError } from '../../error/index.ts'

export class StringStaticPart extends Expression {
    static override friendlyName = '문자'

    constructor(content: string, tokens: Token[]) {
        super(content, tokens)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.tokens
            .filter((t) => t.value.includes('\n'))
            .map(
                () =>
                    new UnexpectedCharError({
                        scope,
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
        content: (StringStaticPart | Evaluable | Expression)[],
        public override tokens: Token[],
    ) {
        if (StringPartSequence.isBroken(content)) {
            throw new NotAcceptableSignal()
        }

        super()
        this.subnode = content
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const parts = await Promise.all(
            this.subnode.slice(1, -1).map((n) => {
                if (n instanceof StringStaticPart) {
                    return new StringValue(n.value)
                }

                return n.execute(scope)
            }),
        )

        const result = parts.reduce<Promise<ValueType>>(
            (acc, current) => {
                return new PlusOperator([]).call(
                    () => Promise.resolve(acc),
                    () => Promise.resolve(current.toStringValue()),
                )
            },
            Promise.resolve(new StringValue('')),
        )

        return result
    }

    public static isBroken(content: (StringStaticPart | Evaluable)[]): boolean {
        return content.some(
            (p, index) =>
                p instanceof Expression &&
                (p.value === "'" || p.value === '"') &&
                index !== 0 &&
                index !== content.length - 1,
        )
    }

    public override validate(scope: Scope): YaksokError[] {
        return this.subnode.slice(1, -1).flatMap((n) => n.validate(scope))
    }
}
