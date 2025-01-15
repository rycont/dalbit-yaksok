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
        for (const child of this.children) {
            if (child instanceof Executable) {
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
