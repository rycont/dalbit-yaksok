import {
    BreakNotInLoopError,
    CannotReturnOutsideFunctionError,
} from '../error/index.ts'
import { Scope } from './scope.ts'
import { BreakSignal, ReturnSignal } from './signals.ts'

import type { Executable } from '../node/base.ts'
import { YaksokSession } from '@dalbit-yaksok/core'

export async function executer<NodeType extends Executable>(
    node: NodeType,
    session: YaksokSession,
): Promise<Scope> {
    const scope = new Scope({
        session,
    })

    try {
        await node.execute(scope)
        return scope
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
