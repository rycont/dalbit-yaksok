import {
    Block,
    Evaluable,
    isTruthy,
    LoopWithoutBodyError,
    NodeCapability,
    onRunChild,
    Statement,
    Token,
    YaksokError,
    RunFrame,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class ConditionalLoop implements Statement {
    static friendlyName = '반복 동안'
    static accepts = [NodeCapability.LOOP_CONTROL]
    public parsingErrors: YaksokError[] = []

    constructor(
        private condition: Evaluable,
        private body: Block,
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame) {
        if (this.body.tokens.length === 0) {
            return
        }

        try {
            while (true) {
                const conditionValue = await this.condition.execute(runFrame)
                if (!isTruthy(conditionValue)) {
                    break
                }

                await onRunChild({
                    scope: this.scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                try {
                    await this.body.execute(runFrame)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) {
                throw e
            }
        }
    }

    validate(): YaksokError[] {
        const childErrors = this.body.validate()
        const conditionErrors = this.condition.validate()

        const hasBodyError =
            this.body.statements.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...conditionErrors, ...childErrors, hasBodyError].filter(
            Boolean,
        ) as YaksokError[]
    }
}
