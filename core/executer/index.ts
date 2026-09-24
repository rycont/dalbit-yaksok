import {
    BreakNotInLoopError,
    CannotReturnOutsideFunctionError,
} from '../error/index.ts'
import { Scope } from './scope.ts'
import { BreakSignal, ReturnSignal } from './signals.ts'

import type { Executable } from '../node/base.ts'

export async function executer<NodeType extends Executable>(
    node: NodeType,
    scope: Scope,
): Promise<void> {
    try {
        await node.execute(scope)
    } catch (e) {
        if (e instanceof ReturnSignal) {
            throw new CannotReturnOutsideFunctionError({
                tokens: e.tokens,
            })
        }

        if (e instanceof BreakSignal) {
            throw new BreakNotInLoopError({
                tokens: e.tokens,
            })
        }

        throw e
    }
}
