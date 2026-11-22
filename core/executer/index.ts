import { Block } from '../mod.ts'
import { Signal } from './signals.ts'

export async function executer(block: Block): Promise<void> {
    try {
        const runId = Symbol('root')

        const scopeChain = new Map([[block.scope, runId]])
        block.scope.run.set(runId, new Map())

        await block.execute(scopeChain)
    } catch (e) {
        if (e instanceof Signal) {
            throw e.getUnhandledError()
        }

        throw e
    }
}
