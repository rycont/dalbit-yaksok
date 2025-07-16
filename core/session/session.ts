import { YaksokError } from '../error/common.ts'
import {
    AlreadyRegisteredModuleError,
    FFIRuntimeNotFound,
    FileForRunNotExistError,
    MultipleFFIRuntimeError,
} from '../error/prepare.ts'
import { renderErrorString } from '../error/render-error-string.ts'
import { ErrorGroups } from '../error/validation.ts'
import { CodeFile } from '../type/code-file.ts'
import { PubSub } from '../util/pubsub.ts'
import {
    DEFAULT_SESSION_CONFIG,
    type Events,
    type SessionConfig,
} from './session-config.ts'

import { ErrorInFFIExecution } from '@dalbit-yaksok/core'
import type { EnabledFlags } from '../constant/feature-flags.ts'
import {
    AbortedRunModuleResult,
    ErrorRunModuleResult,
    RunModuleResult,
    SuccessRunModuleResult,
    ValidationRunModuleResult,
} from '../constant/type.ts'
import { AbortedSessionSignal } from '../executer/signals.ts'
import type { Extension } from '../extension/extension.ts'
import type { ValueType } from '../value/base.ts'

/**
 * `달빛 약속` 코드의 실행 생명주기를 총괄하는 핵심 클래스입니다.
 * 코드 모듈을 등록하고, 실행 파이프라인(토크나이징, 파싱, 실행)을 조율하며,
 * 외부 환경(입출력, FFI)과의 상호작용을 관리합니다.
 *
 * @description
 * 이 클래스는 `달빛 약속` 인터프리터의 공개 API(Public API)이자 퍼사드(Facade) 역할을 수행합니다.
 * 모든 코드 실행은 이 세션을 통해 시작되고 관리됩니다.
 *
 * @example
 * ```
 * let output = '';
 * const session = new YaksokSession({
 *   stdout: (message) => {
 *     output += message;
 *   }
 * });
 *
 * session.addModule('main', '"안녕" 보여주기');
 * await session.runModule('main');
 * // output: "안녕"
 * ```
 */
export class YaksokSession {
    private BASE_CONTEXT_SYMBOL = Symbol('baseContext')

    public runningPromise: ReturnType<CodeFile['run']> | null = null
    public entrypoint: CodeFile | null = null

    public stdout: SessionConfig['stdout']
    public stderr: SessionConfig['stderr']
    public executionDelay: SessionConfig['executionDelay']
    public flags: Partial<EnabledFlags> = {}
    public extensions: Extension[] = []
    public baseContext?: CodeFile
    public signal: AbortSignal | null = null

    public pubsub: PubSub<Events> = new PubSub<Events>()
    public files: Record<string | symbol, CodeFile> = {}

    /**
     * 새로운 `달빛 약속` 실행 세션을 생성합니다.
     * @param config - 세션의 동작을 사용자화하는 설정 객체입니다.
     *   - `stdout`: 코드 내 `보여주기` 명령의 출력 스트림을 지정합니다.
     *   - `stderr`: 오류 메시지 출력 스트림을 지정합니다.
     *   - `executionDelay`: 각 실행 가능한 코드 라인 사이의 지연 시간(ms)을 설정합니다. 디버깅이나 시각화에 유용합니다.
     *   - `events`: 'runningCode'와 같은 내부 이벤트를 구독할 핸들러를 등록합니다.
     */
    constructor(config: Partial<SessionConfig> = {}) {
        const resolvedConfig = { ...DEFAULT_SESSION_CONFIG, ...config }

        for (const _event in resolvedConfig.events) {
            const event = _event as keyof Events
            this.pubsub.sub(event as keyof Events, resolvedConfig.events[event])
        }

        this.stdout = resolvedConfig.stdout
        this.stderr = resolvedConfig.stderr

        this.executionDelay = resolvedConfig.executionDelay
        this.flags = resolvedConfig.flags
        this.signal = resolvedConfig.signal ?? null
    }

    /**
     * 세션에 코드 모듈을 추가합니다.
     *
     * @description
     * 추가된 코드는 즉시 실행되지 않고, `runModule`이 호출될 때 참조됩니다.
     * 각 코드는 `CodeFile` 인스턴스로 변환되어 관리됩니다.
     *
     * @param moduleName - 모듈을 식별하는 고유한 이름 또는 심볼입니다.
     * @param code - 실행할 `달빛 약속` 소스코드 문자열입니다.
     * @returns 생성된 `CodeFile` 인스턴스를 반환합니다.
     *
     * @example
     * ```
     * session.addModule('utils', '약속, 더하기 (A) (B)
    A + B 반환하기');
     * session.addModule('main', '(@utils 더하기 1 2) 보여주기');
     * ```
     */
    addModule(moduleName: string | symbol, code: string): CodeFile {
        if (this.files[moduleName]) {
            throw new AlreadyRegisteredModuleError({
                resource: { moduleName: moduleName.toString() },
            })
        }
        const codeFile = new CodeFile(code, moduleName)
        codeFile.mount(this)

        this.files[moduleName] = codeFile
        // addModule은 entryPoint를 변경하지 않음
        return codeFile
    }

    /**
     * 여러 개의 코드 모듈을 한 번에 추가합니다.
     * @param modules - 모듈 이름을 키로, 소스코드를 값으로 하는 객체입니다.
     */
    addModules(modules: Record<string, string>): void {
        for (const [moduleName, code] of Object.entries(modules)) {
            this.addModule(moduleName, code)
        }
    }

    /**
     * 세션에 FFI(Foreign Function Interface)를 위한 확장을 추가합니다.
     * @param extension - FFI 런타임을 제공하는 확장 객체입니다.
     *
     * @example
     * ```
     * await session.extend(new QuickJS()); // QuickJS 런타임 확장 추가
     * ```
     */
    async extend(extension: Extension): Promise<void> {
        this.extensions.push(extension)
        await extension.init?.()
    }

    /**
     * 지정된 모듈을 엔트리포인트로 하여 코드를 실행합니다.
     *
     * @description
     * 이 메서드는 `달빛 약속` 코드 실행의 전체 과정을 조율합니다.
     * 1. **상태 잠금**: `isRunning` 플래그를 `true`로 설정하여 동시 실행을 방지합니다.
     * 2. **유효성 검사**: 실행 전 `validate()`를 호출하여 코드의 정적 오류를 미리 확인합니다.
     * 3. **실행**: `CodeFile.run()`을 호출하여 실제 코드 실행을 시작합니다.
     * 4. **오류 처리**: 실행 중 발생하는 모든 종류의 오류를 `catch`하여 적절한 `RunModuleResult`로 변환합니다.
     * 5. **상태 해제**: `finally` 블록에서 `isRunning` 플래그를 `false`로 설정하여 세션이 다시 실행 가능한 상태임을 보장합니다.
     *
     * @param moduleName - 실행을 시작할 모듈(엔트리포인트)의 이름입니다.
     * @returns 코드 실행 결과를 담은 `RunModuleResult` 객체를 반환합니다.
     */
    async runModule(moduleName: string | symbol): Promise<RunModuleResult> {
        if (this.runningPromise) {
            await this.runningPromise
        }

        const codeFile = this.files[moduleName]
        if (!codeFile) {
            return {
                reason: 'error',
                error: new FileForRunNotExistError({
                    resource: {
                        fileName: moduleName.toString(),
                        files: Object.keys(this.files),
                    },
                }),
            }
        }

        this.entrypoint = codeFile

        try {
            this.validate(moduleName)
            this.runningPromise = codeFile.run()
            await this.runningPromise

            return {
                codeFile,
                reason: 'finish',
            } as SuccessRunModuleResult
        } catch (e) {
            if (e instanceof ErrorGroups) {
                const errors = e.errors

                for (const [fileName, errorList] of errors) {
                    const codeFile = this.getCodeFile(fileName)

                    for (const error of errorList) {
                        error.codeFile = codeFile
                        this.stderr(renderErrorString(error))
                    }
                }

                return {
                    codeFile,
                    reason: 'validation',
                    errors: e,
                } as ValidationRunModuleResult
            }

            if (e instanceof YaksokError) {
                if (!e.codeFile) {
                    e.codeFile = codeFile
                }

                this.stderr(renderErrorString(e))

                return {
                    codeFile,
                    reason: 'error',
                    error: e,
                } as ErrorRunModuleResult
            }

            if (e instanceof AbortedSessionSignal) {
                return {
                    codeFile,
                    reason: 'aborted',
                } as AbortedRunModuleResult
            }

            throw e
        } finally {
            this.runningPromise = null
        }
    }

    /**
     * 모든 모듈이 공유하는 기본 컨텍스트를 설정합니다.
     * 여기에 정의된 변수나 함수는 모든 모듈의 최상위 스코프에서 접근 가능합니다.
     * @param code - 기본 컨텍스트로 사용할 `달빛 약속` 코드입니다.
     */
    async setBaseContext(code: string): Promise<RunModuleResult> {
        this.addModule(this.BASE_CONTEXT_SYMBOL, code)

        const result = await this.runModule(this.BASE_CONTEXT_SYMBOL)

        if (result.reason === 'finish') {
            this.baseContext = result.codeFile
        }

        return result
    }

    /**
     * 지정된 엔트리포인트부터 시작하여 모든 참조된 코드의 유효성을 검사합니다.
     * @param entrypoint - 유효성 검사를 시작할 모듈의 이름입니다. 지정하지 않으면 모든 모듈을 검사합니다.
     */
    validate(entrypoint?: string | symbol): void {
        const filesToValidate: Record<string | symbol, CodeFile> = {}
        if (entrypoint) {
            if (this.files[entrypoint]) {
                filesToValidate[entrypoint] = this.files[entrypoint]
            } else {
                throw new FileForRunNotExistError({
                    // 또는 다른 적절한 오류 타입
                    resource: {
                        fileName: entrypoint.toString(),
                        files: Object.keys(this.files),
                    },
                })
            }
        } else {
            Object.assign(filesToValidate, this.files)
        }

        const validationErrors = new Map(
            Object.entries(filesToValidate).map(([fileName, codeFile]) => [
                fileName,
                codeFile.validate().errors,
            ]),
        )

        const allErrors = [...validationErrors.values()].flat()
        if (allErrors.length > 0) {
            throw new ErrorGroups(validationErrors)
        }
    }

    /**
     * 세션에 등록된 `CodeFile` 인스턴스를 가져옵니다.
     * @param fileName - 가져올 모듈의 이름입니다.
     * @returns `CodeFile` 인스턴스를 반환합니다.
     */
    public getCodeFile(fileName: string): CodeFile {
        if (!this.files[fileName]) {
            throw new FileForRunNotExistError({
                resource: {
                    fileName: fileName,
                    files: Object.keys(this.files),
                },
            })
        }

        return this.files[fileName]
    }

    /**
     * 등록된 FFI 확장을 통해 외부 코드를 실행합니다.
     * @param runtime - 사용할 FFI 런타임의 이름입니다 (예: 'QuickJS').
     * @param code - FFI 런타임에서 실행할 코드입니다.
     * @param args - 코드를 실행할 때 전달할 인자입니다.
     * @returns 실행 결과를 `달빛 약속`의 `ValueType`으로 변환하여 반환합니다.
     */
    public async runFFI(
        runtime: string,
        code: string,
        args: Record<string, any>,
    ): Promise<ValueType> {
        const availableExtensions = this.extensions.filter(
            (ext) => ext.manifest.ffiRunner?.runtimeName === runtime,
        )

        if (availableExtensions.length === 0) {
            throw new FFIRuntimeNotFound({
                resource: { runtimeName: runtime },
            })
        }

        if (availableExtensions.length > 1) {
            throw new MultipleFFIRuntimeError({
                resource: { runtimeName: runtime },
            })
        }

        const extension = availableExtensions[0]

        try {
            const result = await extension.executeFFI(code, args)

            return result
        } catch (error) {
            if (error instanceof ErrorInFFIExecution) {
                throw error
            }

            if (error instanceof Error) {
                throw new ErrorInFFIExecution({
                    message: `FFI 실행 중 오류 발생: ${error.message}`,
                })
            }

            throw new ErrorInFFIExecution({
                message: `FFI 실행 중 알 수 없는 오류 발생: ${error}`,
            })
        }
    }
}

/**
 * `YaksokSession`을 생성하고 코드를 실행하는 과정을 간소화한 헬퍼 함수입니다.
 * 단일 파일 또는 여러 파일로 구성된 간단한 코드를 실행할 때 유용합니다.
 * @param code - 단일 코드 문자열 또는 모듈 이름을 키로 갖는 코드 객체입니다.
 * @returns 코드 실행 결과를 담은 `RunModuleResult` 객체를 반환합니다.
 *
 * @example
 * ```
 * // 단일 파일 실행
 * await yaksok('"안녕" 보여주기');
 *
 * // 여러 파일 실행
 * await yaksok({
 *   main: '(@math 더하기 1 2) 보여주기',
 *   math: '약속, 더하기 (A) (B)
    A + B 반환하기'
 * });
 * ```
 */
export async function yaksok(
    code: string | Record<string, string>,
): Promise<RunModuleResult> {
    const session = new YaksokSession()

    if (typeof code === 'string') {
        session.addModule('main', code)
    } else {
        for (const [fileName, fileCode] of Object.entries(code)) {
            session.addModule(fileName, fileCode)
        }
    }

    return await session.runModule('main')
}
