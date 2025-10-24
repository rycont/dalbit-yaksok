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
    if (!session) {
        const fileName = scope.codeFile?.fileName
        const fileLabel =
            typeof fileName === 'string'
                ? fileName
                : typeof fileName === 'symbol'
                  ? fileName.description ?? fileName.toString()
                  : '알 수 없는 파일'

        console.warn(
            `loop-iteration-limit-exceeded 경고를 발행하지 못했습니다. ` +
                `${fileLabel} 스코프가 세션에 마운트되어 있는지 확인해주세요.`,
        )
        return
    }

    const warning: WarningEvent = {
        type: 'loop-iteration-limit-exceeded',
        iterations,
        scope,
        tokens,
    }

    session.pubsub.pub('warning', [warning])
}
