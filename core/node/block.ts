import { CannotParseError } from '../error/index.ts'
import { Executable, type Node } from './base.ts'
import { EOL } from './misc.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class Block extends Executable {
    static override friendlyName = '코드 덩어리'

    children: Node[]

    constructor(content: Node[], public override tokens: Token[]) {
        super()
        this.children = content
    }

    override async execute(scope: Scope) {
        const executionDelay = scope.codeFile?.runtime?.executionDelay
        for (const child of this.children) {
            if (child instanceof Executable) {
                if (executionDelay) {
                    await new Promise((r) =>
                        setTimeout(r, scope.codeFile?.runtime?.executionDelay),
                    )
                }
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
}
