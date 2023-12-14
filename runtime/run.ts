import { Block } from '../node/index.ts'
import { Scope } from '../runtime/scope.ts'

export function run(block: Block) {
    const scope = new Scope()
    block.execute(scope)

    return scope
}
