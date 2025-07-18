import { YaksokError } from '../error/common.ts'
import { CannotParseError } from '../error/index.ts'
import { Executable, type Node } from './base.ts'
import { EOL } from './misc.ts'

import type { Scope } from '../executer/scope.ts'
import { AbortedSessionSignal } from '../executer/signals.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class Block extends Executable {
    static override friendlyName = '코드 덩어리'

    children: Node[]

    constructor(content: Node[], public override tokens: Token[]) {
        super()
        this.children = content
    }

    override async execute(scope: Scope): Promise<void> {
        const executionDelay = scope.codeFile?.session?.executionDelay

        const isMainContext =
            scope.codeFile?.session?.entrypoint === scope.codeFile
        const isBaseContext =
            scope.codeFile?.fileName ===
            scope.codeFile?.session?.BASE_CONTEXT_SYMBOL

        for (const child of this.children) {
            if (scope.codeFile?.session?.signal?.aborted) {
                throw new AbortedSessionSignal(child.tokens)
            }

            if (child instanceof Executable) {
                if (executionDelay && isMainContext && !isBaseContext) {
                    await new Promise((r) => setTimeout(r, executionDelay))
                }

                if (child.tokens.length) {
                    this.reportRunningCode(child, scope)
                }

                await child.execute(scope)
            } else if (child instanceof EOL) {
                continue
            } else {
                throw new CannotParseError({
                    resource: {
                        part: child,
                    },
                    tokens: child.tokens,
                })
            }
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const childErrors = this.children
            .flatMap((child) => child.validate(scope))
            .filter((error) => error !== null)

        return childErrors
    }

    reportRunningCode(child: Executable, scope: Scope) {
        const startPosition = child.tokens[0].position
        const endToken = child.tokens[child.tokens.length - 1]
        const endPosition = {
            line: endToken.position.line,
            column: endToken.position.column + endToken.value.length,
        }
        scope.codeFile?.session?.pubsub.pub('runningCode', [
            {
                line: startPosition.line,
                column: startPosition.column,
            },
            endPosition,
            scope,
        ])
    }
}
