import {
    Block,
    LoopWithoutBodyError,
    NodeCapability,
    onRunChild,
    RunFrame,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class UnconditionedLoop implements Statement {
    static accepts = [NodeCapability.LOOP_CONTROL]
    public parsingErrors: YaksokError[] = []

    static friendlyName = '반복'

    constructor(
        public scope: Scope,
        public body: Block,
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame) {
        if (this.body.tokens.length === 0) {
            return
        }

        try {
            while (true) {
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

        const hasBodyError =
            this.body.statements.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...childErrors, hasBodyError].filter(Boolean) as YaksokError[]
    }
}
