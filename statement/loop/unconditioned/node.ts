import {
    Block,
    LoopWithoutBodyError,
    NodeCapability,
    onRunChild,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class UnconditionedLoop implements Statement {
    static accepts = [NodeCapability.LOOP_CONTROL]

    static friendlyName = '반복'

    constructor(
        public body: Block,
        public tokens: Token[],
    ) {}

    async execute(scope: Scope) {
        if (this.body.tokens.length === 0) {
            return
        }

        try {
            while (true) {
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
            if (!(e instanceof BreakSignal)) {
                throw e
            }
        }
    }

    validate(scope: Scope): YaksokError[] {
        const childErrors = this.body.validate(scope)

        const hasBodyError =
            this.body.statements.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...childErrors, hasBodyError].filter(Boolean) as YaksokError[]
    }
}
