import type { EnabledFlags } from '../constant/feature-flags.ts'
import type { FunctionInvokingParams } from '../constant/type.ts'
import type { Position } from '../type/position.ts'
import type { ValueType } from '../value/base.ts'

/**
 * RuntimeConfig 객체를 사용하여 약속 런타임을 설정합니다.
 *
 * ```typescript
 * import { yaksok, RuntimeConfig } from '@dalbit-yaksok/core'
 *
 * const runtimeConfig: RuntimeConfig = {
 *    stdout: console.log,
 *    stderr: console.error,
 *    entryPoint: 'main',
 *    executionDelay: 0,
 *    runFFI: (runtime, code, args) => {
 *        throw new Error(`FFI ${runtime} not implemented`)
 *    },
 *    flags: {},
 *    events: {
 *        runningCode: (start, end) => {
 *            //  Do something with start and end
 *        )
 *    }
 * }
 *
 * await yaksok(`"안녕" 보여주기`, runtimeConfig)
 * ```
 */

export interface RuntimeConfig {
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
     * 각 라인의 실행을 지연시킬 시간 (밀리초). 코드 시각화 목적으로 사용합니다.
     * @default 0
     */
    executionDelay: number
    /**
     * 번역 문법을 사용한 외부 런타임 호출을 처리하는 메소드
     * ```typescript
     * function runFFI(runtime: string, code: string, args: FunctionInvokingParams): Promise<ValueType> {
     *
     * }
     * ```
     */
    runFFI: (
        runtime: string,
        code: string,
        args: FunctionInvokingParams,
    ) => Promise<ValueType> | ValueType
    /**
     * 활성화할 기능 플래그
     */
    flags: EnabledFlags
    /**
     * 코드 실행 중 발생하는 이벤트를 구독합니다.
     */
    events: Events
}

export type Events = {
    /**
     * 현재 실행 중인 코드의 범위를 알려줍니다.
     * @param start
     * @param end
     * @returns
     */
    runningCode: (start: Position, end: Position) => void
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
    stdout: console.log,
    stderr: console.error,
    entryPoint: 'main',
    runFFI: (runtime: string) => {
        throw new Error(`FFI ${runtime} not implemented`)
    },
    flags: {},
    executionDelay: 0,
    events: {
        runningCode: () => {},
    },
}
