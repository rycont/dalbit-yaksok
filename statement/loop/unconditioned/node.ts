import {
    Block,
    Executable,
    LoopWithoutBodyError,
    NodeCapability,
    Scope,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class UnconditionedLoop extends Executable {
    static override accepts = [NodeCapability.LOOP_CONTROL]

    static override friendlyName = '반복'

    constructor(
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope) {
        if (this.body.tokens.length === 0) {
            return
        }

        try {
            while (true) {
                await this.onRunChild({
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

    override validate(scope: Scope): YaksokError[] {
        const childErrors = this.body.validate(scope)

        const hasBodyError =
            this.body.subnode.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...childErrors, hasBodyError].filter(Boolean) as YaksokError[]
    }
}
