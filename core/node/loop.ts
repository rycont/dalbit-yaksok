import { BreakSignal, ContinueSignal } from '../executer/signals.ts'
import { Executable, NodeCapability } from './base.ts'

import { YaksokError } from '../error/common.ts'
import { LoopWithoutBodyError } from '../error/loop.ts'
import type { Scope } from '../executer/scope.ts'
import { type Token } from '../prepare/tokenize/token.ts'
import type { Block } from './block.ts'

export class Loop extends Executable {
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

export class Break extends Executable {
    static override friendlyName = '그만'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<never> {
        throw new BreakSignal(this.tokens)
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Continue extends Executable {
    static override friendlyName = '다음 반복'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<never> {
        throw new ContinueSignal(this.tokens)
    }

    override validate(): YaksokError[] {
        return []
    }
}
