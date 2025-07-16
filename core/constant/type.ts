import { YaksokError } from '../error/common.ts'
import { ErrorGroups } from '../error/validation.ts'
import { CodeFile } from '../type/code-file.ts'
import { ValueType } from '../value/base.ts'

export interface FunctionInvokingParams {
    [key: string]: ValueType
}

/**
 * 모듈 실행 결과의 기본 인터페이스.
 * 모든 모듈 실행 결과 타입은 이 인터페이스를 확장합니다.
 */
export interface RunModuleResultBase {
    /**
     * 실행된 코드 파일.
     */
    codeFile?: CodeFile
}

/**
 * 모듈 실행이 성공적으로 완료되었을 때의 결과.
 *
 * ```typescript
 * const session = new YaksokSession();
 * session.addModule('main', `"안녕" 보여주기`);
 * const result = await session.runModule('main');
 * // result.reason is 'finish'
 * ```
 */
export interface SuccessRunModuleResult extends RunModuleResultBase {
    reason: 'finish'
    codeFile: CodeFile
}

/**
 * 모듈 실행이 중단되었을 때의 결과.
 *
 * ```typescript
 * const controller = new AbortController();
 * const session = new YaksokSession({ signal: controller.signal });
 *
 * session.addModule('main', /* Some codes that take a long time *\/);
 *
 * setTimeout(() => {
 *   controller.abort(); // 3초 후 실행 중단
 * }, 3000);
 *
 * const result = await session.runModule('main');
 * // result.reason is 'aborted'
 * ```
 */
export interface AbortedRunModuleResult extends RunModuleResultBase {
    reason: 'aborted'
    codeFile: CodeFile
}

/**
 * 모듈 실행 중 약속 오류가 발생했을 때의 결과.
 *
 * ```typescript
 * const session = new YaksokSession();
 * session.addModule('main', `1 / 0 보여주기`); // 0으로 나누기 오류
 * const result = await session.runModule('main');
 * // result.reason is 'error'
 * ```
 */
export interface ErrorRunModuleResult extends RunModuleResultBase {
    reason: 'error'
    /**
     * 발생한 약속 오류.
     */
    error: YaksokError
}

/**
 * `runModule` 호출 시 유효성 검사 오류가 발생했을 때의 결과.
 *
 * ```typescript
 * const session = new YaksokSession();
 * session.addModule('main', `변수 = 1 +`); // 문법 오류
 * const result = await session.runModule('main');
 * // result.reason is 'validation'
 * ```
 */
export type ValidationRunModuleResult = Omit<
    RunModuleResultBase,
    'codeFile'
> & {
    reason: 'validation'
    /**
     * 발생한 유효성 검사 오류 그룹.
     */
    errors: ErrorGroups
}

export type RunModuleResult =
    | SuccessRunModuleResult
    | AbortedRunModuleResult
    | ErrorRunModuleResult
    | ValidationRunModuleResult
