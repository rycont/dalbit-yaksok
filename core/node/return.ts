import { ReturnSignal } from '../executer/signals.ts'
import { Executable } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class Return extends Executable {
    static override friendlyName = '결과'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<never> {
        throw new ReturnSignal(this.tokens)
    }
}
