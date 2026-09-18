import { YaksokError } from '../error/common.ts'
import {
    AlreadyRegisteredModuleError,
    FFIRuntimeNotFound,
    FileForRunNotExistError,
    MultipleFFIRuntimeError,
} from '../error/prepare.ts'
import {
    errorToMachineReadable,
    renderErrorString,
} from '../error/render-error-string.ts'
import { CodeFile } from '../type/code-file.ts'
import { PubSub } from '../util/pubsub.ts'
import {
    DEFAULT_SESSION_CONFIG,
    type Events,
    type SessionConfig,
} from './session-config.ts'

import {
    AbortedRunModuleResult,
    ErrorRunModuleResult,
    FunctionInvokingParams,
    RunModuleResult,
    SuccessRunModuleResult,
} from '../constant/type.ts'
import { AbortedSessionSignal } from '../executer/signals.ts'
import type { Extension } from '../extension/extension.ts'
import type { ValueType } from '../value/base.ts'
import type { Scope } from '../executer/scope.ts'

import { ErrorInFFIExecution } from '../error/ffi.ts'

const THREAD_YIELD_INTERVAL = 300

export class YaksokSession {
    /** 현재 실행 중인 runModule Promise */
    public runningPromise: Promise<
        [string | symbol, RunModuleResult][]
    > | null = null
    /** `보여주기` 출력 훅 */
    public stdout: SessionConfig['stdout']
    /** 에러 출력 훅 */
    public stderr: SessionConfig['stderr']
    /** FFI 확장 목록 */
    public extensions: Extension[] = []
    public baseScope: Scope | null = null
    /** 외부 중단 시그널 */
    public signal: AbortSignal | null = null
    public stepByStep: boolean = false
    /** 세션 이벤트 버스 */
    public pubsub: PubSub<Events> = new PubSub<Events>()
    /** 세션에 등록된 모듈 저장소 */
    public files: Record<string | symbol, CodeFile> = {}

    private tickCounter = 0

    public eventCreation: PubSub<{
        [key: string]: (
            args: FunctionInvokingParams,
            callback: () => void,
            terminate: () => void,
            scope: Scope,
        ) => void
    }> = new PubSub()

    public aliveListeners: Promise<void>[] = []

    constructor(config: Partial<SessionConfig> = {}) {
        const resolvedConfig = { ...DEFAULT_SESSION_CONFIG, ...config }

        for (const _event in resolvedConfig.events) {
            const event = _event as keyof Events
            this.pubsub.sub(
                event as keyof Events,
                resolvedConfig.events[event as keyof Events]!,
            )
        }

        this.stdout = resolvedConfig.stdout
        this.stderr = resolvedConfig.stderr
        this.signal = resolvedConfig.signal ?? null
    }

    addModule(moduleName: string | symbol, code: string): CodeFile {
        if (this.files[moduleName]) {
            throw new AlreadyRegisteredModuleError({
                resource: { moduleName: moduleName.toString() },
            })
        }

        const codeFile = new CodeFile(code, moduleName, this)

        this.files[moduleName] = codeFile
        return codeFile
    }

    async extend(extension: Extension): Promise<void> {
        this.extensions.push(extension)
        const initPromise = extension.init?.()

        if (extension.manifest.module) {
            const { module } = extension.manifest
            for (const { fileName, code, baseScope } of module) {
                const ranScope = await this.addModule(fileName, code).run()
                if (baseScope) {
                    this.useBaseScope(ranScope)
                }
            }
        }

        await initPromise
    }

    public useBaseScope(scope: Scope): void {
        this.baseScope = scope
    }

    private async runOneModule(
        moduleName: string | symbol,
    ): Promise<RunModuleResult> {
        const codeFile = this.files[moduleName]

        if (!codeFile) {
            return {
                reason: 'error',
                errors: [
                    new FileForRunNotExistError({
                        resource: {
                            fileName: moduleName.toString(),
                            files: Object.keys(this.files),
                        },
                    }),
                ],
            }
        }

        if (codeFile.prepareErrors) {
            return {
                reason: 'validation',
                errors: codeFile.prepareErrors,
            }
        }

        try {
            const ranScope = await codeFile.run()
            await Promise.all(this.aliveListeners)

            return {
                scope: ranScope,
                reason: 'finish',
            } as SuccessRunModuleResult
        } catch (e) {
            if (e instanceof YaksokError) {
                if (!e.codeFile) {
                    e.codeFile = codeFile
                }

                this.stderr(renderErrorString(e), errorToMachineReadable(e))

                return {
                    reason: 'error',
                    errors: [e],
                } as ErrorRunModuleResult
            }

            if (e instanceof AbortedSessionSignal) {
                return {
                    reason: 'aborted',
                } as AbortedRunModuleResult
            }

            throw e
        } finally {
            this.runningPromise = null
        }
    }

    async runModule<const T extends (string | symbol)[]>(
        moduleName: T,
    ): Promise<Record<T[number], RunModuleResult>> {
        if (this.runningPromise) {
            await this.runningPromise
        }

        const runModuleNames = Array.isArray(moduleName)
            ? moduleName
            : [moduleName]

        const runningPromise = Promise.all(
            runModuleNames.map<Promise<[T[number], RunModuleResult]>>(
                async (n) => [n, await this.runOneModule(n)],
            ),
        )

        this.runningPromise = runningPromise

        const entries = Object.fromEntries(await runningPromise) as Record<
            T[number],
            RunModuleResult
        >

        return entries
    }

    public async runFFI(
        runtime: string,
        code: string,
        args: Record<string, any>,
        callerScope: Scope,
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
            const result = await extension.executeFFI(code, args, callerScope)
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

    public async tick(): Promise<void> {
        if (this.tickCounter++ % THREAD_YIELD_INTERVAL === 0) {
            await new Promise((ok) => setTimeout(ok, 0))
        }
    }
}
