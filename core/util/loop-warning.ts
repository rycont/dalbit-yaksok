import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { WarningEvent } from '../type/events.ts'

export const LOOP_WARNING_THRESHOLD = 256

export function emitLoopIterationWarning({
    scope,
    tokens,
    iterations,
}: {
    scope: Scope
    tokens: Token[]
    iterations: number
}) {
    const session = scope.codeFile?.session
    if (!session) return

    const warning: WarningEvent = {
        type: 'loop-iteration-limit-exceeded',
        iterations,
        scope,
        tokens,
    }

    session.pubsub.pub('warning', [warning])
}
