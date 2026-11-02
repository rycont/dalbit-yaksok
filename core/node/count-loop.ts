import {
    Block,
    BreakSignal,
    ContinueSignal,
    Evaluable,
    Executable,
    LoopCountIsNotNumberError,
    NodeCapability,
    NumberValue,
    Scope,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class CountLoop extends Executable<{
    count: Evaluable
    body: Block
}> {
    static override friendlyName = '횟수 반복'
    static override accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        count: Evaluable,
        body: Block,
        public override tokens: Token[],
    ) {
        super()

        this.subnode = {
            count,
            body,
        }
    }

    override async execute(parent: Scope): Promise<void> {
        const scope = new Scope({
            parent: parent,
        })

        const countValue = await this.subnode.count.execute(scope)

        if (!(countValue instanceof NumberValue)) {
            throw new LoopCountIsNotNumberError({
                tokens: this.subnode.count.tokens,
                value: countValue,
            })
        }

        const countNumber = countValue.value

        try {
            for (let i = 0; i < countNumber; i++) {
                await this.onRunChild({
                    scope,
                    childTokens: this.subnode.body.tokens,
                    skipReport: true,
                })
                try {
                    await this.subnode.body.execute(scope)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        return this.subnode.body.validate(scope)
    }
}
