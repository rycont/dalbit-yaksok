import { BreakSignal } from '../executer/signals.ts'
import { Executable } from './base.ts'

import { TOKEN_TYPE, type Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'
import type { Block } from './block.ts'
import { YaksokError } from '../error/common.ts'
import { NoBreakOrReturnError } from '../error/loop.ts'

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

    override validate(scope: Scope): YaksokError[] {
        const noBreakOrReturnError = hasBreakOrReturn(this)
            ? []
            : [
                  new NoBreakOrReturnError({
                      tokens: this.tokens,
                  }),
              ]

        const childErrors = this.body.validate(scope)

        return [...noBreakOrReturnError, ...childErrors]
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

function hasBreakOrReturn(node: Loop) {
    return node.tokens.some((token, index) => {
        if (token.type === TOKEN_TYPE.IDENTIFIER && token.value === '반복') {
            const nextToken = node.tokens[index + 1]
            if (
                nextToken &&
                nextToken.type === TOKEN_TYPE.IDENTIFIER &&
                nextToken.value === '그만'
            ) {
                return true
            }
        }

        if (token.type === TOKEN_TYPE.IDENTIFIER && token.value === '반환') {
            return true
        }
    })
}
