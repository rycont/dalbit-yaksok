import { type Executable } from '@dalbit-yaksok/core'

import { Scope } from './scope.ts'
import { Signal } from './signals.ts'

export async function executer<NodeType extends Executable>(
    node: NodeType,
    scope: Scope,
): Promise<void> {
    try {
        await node.execute(scope)
    } catch (e) {
        if (e instanceof Signal) {
            throw e.getUnhandledError()
        }

        throw e
    }
}
