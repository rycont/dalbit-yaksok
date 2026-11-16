import {
    Evaluable,
    Scope,
    StringValue,
    Token,
    ValueType,
    YaksokError,
    Node,
} from '@dalbit-yaksok/core'

export class EOL extends Node {
    static override friendlyName = '줄바꿈'

    constructor(public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class TypeOf extends Evaluable<Evaluable> {
    static override friendlyName = '값 종류'

    constructor(
        value: Evaluable,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = value
    }

    override async execute(scope: Scope): Promise<StringValue> {
        const evaluated = await this.subnode.execute(scope)

        return new StringValue(
            (evaluated.constructor as typeof ValueType).friendlyName,
        )
    }

    override validate(scope: Scope): YaksokError[] {
        return this.subnode.validate(scope)
    }
}
