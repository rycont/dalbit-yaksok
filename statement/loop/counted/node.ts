import {
    Block,
    Evaluable,
    LoopCountIsNotNumberError,
    NodeCapability,
    NumberValue,
    onRunChild,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class CountLoop implements Statement {
    static friendlyName = '횟수 반복'
    static accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        private count: Evaluable,
        private body: Block,
        public tokens: Token[],
    ) {}

    async execute(parent: Scope): Promise<void> {
        const scope = new Scope({
            parent: parent,
        })

        const countValue = await this.count.execute(scope)

        if (!(countValue instanceof NumberValue)) {
            throw new LoopCountIsNotNumberError({
                tokens: this.count.tokens,
                value: countValue,
            })
        }

        const countNumber = countValue.value

        try {
            for (let i = 0; i < countNumber; i++) {
                await onRunChild({
                    scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
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

    validate(scope: Scope): YaksokError[] {
        return this.body.validate(scope)
    }
}
