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

    override async execute(scope: Scope) {
        try {
            while (true) {
                await this.body.execute(scope)
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

    override execute(_scope: Scope): Promise<never> {
        throw new BreakSignal(this.tokens)
    }
}
