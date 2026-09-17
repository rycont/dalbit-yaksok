import { YaksokError } from '../error/common.ts'
import { CannotParseError } from '../error/index.ts'
import { Executable, type Node } from './base.ts'
import { EOL } from './misc.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class Block extends Executable<Node[]> {
    static override friendlyName = '코드 덩어리'

    constructor(
        content: Node[],
        public override tokens: Token[],
    ) {
        super()
        this.subnode = content
    }

    override async execute(scope: Scope): Promise<void> {
        for (const child of this.subnode) {
            if (child instanceof Executable) {
                if (scope.codeFile?.session?.canRunNode) {
                    if (
                        !(await scope.codeFile?.session?.canRunNode(
                            scope,
                            child,
                        ))
                    ) {
                        return
                    }
                }

                await this.onRunChild({
                    childTokens: child.tokens,
                    scope,
                })
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
        const childErrors = this.subnode
            .flatMap((child) => child.validate(scope))
            .filter((error) => error !== null)

        return childErrors
    }
}
