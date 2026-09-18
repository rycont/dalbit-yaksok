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

export class StringStaticPart extends Expression {
    static override friendlyName = '문자'

    constructor(content: string, tokens: Token[]) {
        super(content, tokens)
    }
}

export class StringInterpolationPart extends Evaluable<Evaluable> {
    static override friendlyName = '문자열 끼워넣기 식'

    constructor(
        content: Evaluable,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = content
    }
}

export class StringPartSequence extends Evaluable<
    (StringStaticPart | StringInterpolationPart)[]
> {
    static override friendlyName = '문자'

    constructor(
        content: (StringStaticPart | StringInterpolationPart | Expression)[],
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

    public static isBroken(
        content: (StringStaticPart | StringInterpolationPart)[],
    ) {
        return content.some(
            (p, index) =>
                p instanceof Expression &&
                (p.value === "'" || p.value === '"') &&
                index !== 0 &&
                index !== content.length - 1,
        )
    }

    override validate(scope: Scope) {
        return this.subnode
            .filter((n) => n instanceof Evaluable)
            .flatMap((n) => n.validate(scope))
    }
}
