import { Block, createRunFrame } from '../mod.ts'
import { Signal } from './signals.ts'

export async function executer(block: Block): Promise<void> {
    try {
        await block.execute(createRunFrame(block.scope))
    } catch (e) {
        if (e instanceof Signal) {
            throw e.getUnhandledError()
        }

        throw e
    }
}
