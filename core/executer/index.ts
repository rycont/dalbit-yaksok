import { Statement } from '../mod.ts'

import { Scope } from './scope.ts'
import { Signal } from './signals.ts'

export async function executer<NodeType extends Statement>(
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
