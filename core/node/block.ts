import { CallFrame } from '../executer/callFrame.ts'
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

    override async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        for (const child of this.children) {
            if (child instanceof Executable) {
                await child.execute(scope, callFrame)
            } else if (child instanceof EOL) {
                continue
            } else {
                throw new CannotParseError({
                    position: child.tokens?.[0].position,
                    resource: {
                        part: child,
                    },
                })
            }
        }
    }
}
