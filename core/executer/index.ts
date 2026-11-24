import { Block, RunFrame } from '../mod.ts'
import { Signal } from './signals.ts'

export async function executer(
    block: Block,
    runFrame: RunFrame,
): Promise<void> {
    try {
        await block.execute(runFrame)
    } catch (e) {
        if (e instanceof Signal) {
            throw e.getUnhandledError()
        }

        throw e
    }
}
