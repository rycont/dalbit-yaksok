import type { EnabledFlags } from '../constant/feature-flags.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'

/**
 * SessionConfig 객체를 사용하여 약속 런타임을 설정합니다.
 *
 * ```typescript
 * import { YaksokSession } from '@dalbit-yaksok/core'
 *
 * const session = new YaksokSession({
 *    stdout: console.log,
 *    stderr: console.error,
 *    entryPoint: 'main',
 *    flags: {},
 *    events: {
 *        runningCode: (start, end) => {
 *            //  Do something with start and end
 *        }
 *    },
 *    signal: null,
 * })
 *
 * session.addModule('main', `"안녕" 보여주기`)
 * await session.runModule('main')
 * ```
 */

export interface SessionConfig {
    /**
     * `보여주기`에서 전달된 메시지를 처리하는 메소드
     * @default console.log
     */
    stdout: (message: string) => void
    /**
     * 오류로 인해 발생한 메시지를 처리하는 메소드
     * @default console.error
     */
    stderr: (message: string) => void
    /**
     * 여러 약속 파일이 주어졌을 때 처음으로 실행할 파일 이름입니다.
     * @default 'main'
     */
    entryPoint: string
    /**
     * 활성화할 기능 플래그
     */
    flags: EnabledFlags
    /**
     * 코드 실행 중 발생하는 이벤트를 구독합니다.
     */
    events: Partial<Events>
    /**
     * 코드 실행을 중단시키는 시그널
     */
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

    pause: () => void
    resume: () => void
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
    stdout: console.log,
    stderr: console.error,
    entryPoint: 'main',
    flags: {},
    events: {
        runningCode: () => {},
    },
    signal: null,
}
