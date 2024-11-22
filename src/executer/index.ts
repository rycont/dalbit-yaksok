import {
    BreakNotInLoopError,
    CannotReturnOutsideFunctionError,
} from '../error/index.ts'
import { Scope } from './scope.ts'
import { CallFrame } from './callFrame.ts'
import { BreakSignal, ReturnSignal } from './signals.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { Executable } from '../node/base.ts'

export function executer<NodeType extends Executable>(
    node: NodeType,
    codeFile?: CodeFile,
): ExecuteResult<NodeType> {
    const scope =
        codeFile?.runResult?.scope ||
        new Scope({
            codeFile,
        })

    const callFrame = new CallFrame(node, undefined)

    try {
        const result = node.execute(scope, callFrame) as ReturnType<
            NodeType['execute']
        >
        return { scope, result }
    } catch (e) {
        if (e instanceof ReturnSignal) {
            throw new CannotReturnOutsideFunctionError({
                position: e.position,
            })
        }

        if (e instanceof BreakSignal) {
            throw new BreakNotInLoopError({
                position: e.position,
            })
        }

        throw e
    }
}

export interface ExecuteResult<NodeType extends Executable> {
    scope: Scope
    result: ReturnType<NodeType['execute']>
}
