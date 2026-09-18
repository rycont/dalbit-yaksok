import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'
import type { MachineReadableError } from '../error/render-error-string.ts'

export interface SessionConfig {
    stdout: (message: string) => void
    stderr: (
        message: string,
        machineReadableError: MachineReadableError,
    ) => void
    events: Partial<Events>
    signal: AbortSignal | null
}

export type Events = {
    /**
     * 현재 실행 중인 코드의 범위를 알려줍니다.
     * @param start
     * @param end
     * @returns
     */
    runningCode: (
        start: Position,
        end: Position,
        scope: Scope,
        tokens: Token[],
    ) => void
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
    stdout: console.log,
    stderr: (e) => console.error(e),
    events: {
        runningCode: () => {},
    },
    signal: null,
}
