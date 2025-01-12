import { CallFrame } from '../executer/callFrame.ts'
import { BreakSignal } from '../executer/signals.ts'
import { Executable } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'
import type { Block } from './block.ts'

export class Loop extends Executable {
    static override friendlyName = '반복'

    constructor(public body: Block, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        try {
            while (true) {
                await this.body.execute(scope, callFrame)
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) {
                throw e
            }
        }
    }
}

export class Break extends Executable {
    static override friendlyName = '그만'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope, _callFrame: CallFrame): Promise<never> {
        throw new BreakSignal(this.tokens)
    }
}
