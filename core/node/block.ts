import { YaksokError } from '../error/common.ts'
import { CannotParseError } from '../error/index.ts'
import { Executable, type Node } from './base.ts'
import { EOL } from './misc.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class Block extends Executable {
    static override friendlyName = '코드 덩어리'

    children: Node[]

    constructor(content: Node[], public override tokens: Token[]) {
        super()
        this.children = content
    }

    override async execute(scope: Scope) {
        const executionDelay = scope.codeFile?.runtime?.executionDelay
        const isMainContext =
            scope.codeFile?.fileName === scope.codeFile?.runtime?.entryPoint

        for (const child of this.children) {
            if (child instanceof Executable) {
                if (executionDelay && isMainContext) {
                    await new Promise((r) => setTimeout(r, executionDelay))
                }

                if (child.tokens.length && isMainContext) {
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
        scope.codeFile?.runtime?.pubsub.pub('runningCode', [
            startPosition,
            endPosition,
        ])
    }
}
