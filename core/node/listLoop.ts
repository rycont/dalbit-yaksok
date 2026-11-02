import {
    Block,
    BreakSignal,
    ContinueSignal,
    Evaluable,
    Executable,
    IndexedValue,
    NodeCapability,
    NotEnumerableValueForListLoopError,
    NumberValue,
    Scope,
    StringValue,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'

export class ListLoop extends Executable {
    static override friendlyName = '목록 반복'
    static override accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        public list: Evaluable,
        public variableName: string,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(parent: Scope): Promise<void> {
        const scope = new Scope({
            parent,
        })

        const list = await this.list.execute(scope)

        this.assertRepeatTargetIsList(list)

        try {
            for (const value of list.enumerate()) {
                await this.onRunChild({
                    scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                scope.setVariable(this.variableName, value)
                try {
                    await this.body.execute(scope)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    assertRepeatTargetIsList(
        target: ValueType,
    ): asserts target is IndexedValue | StringValue {
        if (target instanceof IndexedValue || target instanceof StringValue) {
            return
        }

        throw new NotEnumerableValueForListLoopError({
            resource: {
                value: target,
            },
            tokens: this.list.tokens,
        })
    }

    override validate(scope: Scope): YaksokError[] {
        const listScope = new Scope({
            parent: scope,
            initialVariable: {
                [this.variableName]: new NumberValue(0),
            },
        })

        const listErrors = this.list.validate(scope)
        const bodyErrors = this.body.validate(listScope)

        return [...listErrors, ...bodyErrors]
    }
}
