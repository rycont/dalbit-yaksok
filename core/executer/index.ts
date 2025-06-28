import {
    BreakNotInLoopError,
    CannotReturnOutsideFunctionError,
} from '../error/index.ts'
import { Scope } from './scope.ts'
import { BreakSignal, ReturnSignal } from './signals.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { Executable } from '../node/base.ts'

export async function executer<NodeType extends Executable>(
    node: NodeType,
    codeFile?: CodeFile,
): Promise<ExecuteResult<NodeType>> {
    const scope =
        codeFile?.runResult?.scope ||
        new Scope({
            codeFile,
        })

    try {
        const result = (await node.execute(scope)) as Awaited<
            ReturnType<NodeType['execute']>
        >
        return { scope, result }
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

export interface ExecuteResult<NodeType extends Executable> {
    scope: Scope
    result: Awaited<ReturnType<NodeType['execute']>>
}
