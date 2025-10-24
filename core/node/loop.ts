import { BreakSignal } from '../executer/signals.ts'
import { Executable } from './base.ts'

import { YaksokError } from '../error/common.ts'
import { LoopWithoutBodyError, NoBreakOrReturnError } from '../error/loop.ts'
import type { Scope } from '../executer/scope.ts'
import { TOKEN_TYPE, type Token } from '../prepare/tokenize/token.ts'
import type { Block } from './block.ts'
import {
    LOOP_WARNING_THRESHOLD,
    emitLoopIterationWarning,
} from '../util/loop-warning.ts'

export class Loop extends Executable {
    static override friendlyName = '반복'

    constructor(public body: Block, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope) {
        if (this.body.tokens.length === 0) {
            return
        }

        let iterationCount = 0
        let warned = false

        try {
            while (true) {
                iterationCount += 1

                if (!warned && iterationCount > LOOP_WARNING_THRESHOLD) {
                    emitLoopIterationWarning({
                        scope,
                        tokens: this.tokens,
                        iterations: iterationCount,
                    })
                    warned = true
                }

                await this.onRunChild({
                    scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                await this.body.execute(scope)
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) {
                throw e
            }
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const noBreakOrReturnError = hasBreakOrReturn(this, scope)
            ? []
            : [
                  new NoBreakOrReturnError({
                      tokens: this.tokens,
                  }),
              ]

        const childErrors = this.body.validate(scope)

        const hasBodyError =
            this.body.children.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...noBreakOrReturnError, ...childErrors, hasBodyError].filter(
            Boolean,
        ) as YaksokError[]
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

function hasBreakOrReturn(node: Loop, scope: Scope): boolean {
    const shouldSkipValidation =
        scope.codeFile?.session?.flags['skip-validate-break-or-return-in-loop']

    if (shouldSkipValidation) {
        return true
    }

    return node.tokens.some((token, index) => {
        if (
            token.type === TOKEN_TYPE.IDENTIFIER &&
            (token.value === '반복' || token.value === '약속')
        ) {
            const nextToken = node.tokens[index + 1]
            if (
                nextToken &&
                nextToken.type === TOKEN_TYPE.IDENTIFIER &&
                nextToken.value === '그만'
            ) {
                return true
            }
        }

        if (
            token.type === TOKEN_TYPE.IDENTIFIER &&
            token.value === '반환하기'
        ) {
            return true
        }
    })
}
