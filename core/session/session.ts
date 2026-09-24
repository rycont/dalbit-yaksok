import {
    AlreadyRegisteredModuleError,
    CodeFile,
    ErrorInFFIExecution,
    Events,
    Extension,
    FFIRuntimeNotFound,
    FunctionInvokingParams,
    MultipleFFIRuntimeError,
    Rule,
    Scope,
    SessionConfig,
    ValueType,
} from '@dalbit-yaksok/core'

import { PubSub } from '../util/pubsub.ts'
import { DEFAULT_SESSION_CONFIG } from './session-config.ts'

const THREAD_YIELD_INTERVAL = 300

export class YaksokSession {
    public id: string = crypto.randomUUID()

    public runningPromise: Promise<void> | null = null

    public stdout: SessionConfig['stdout']
    public stderr: SessionConfig['stderr']

    public extensions: Extension[] = []
    public baseScope: Scope | null = null
    public signal: AbortSignal | null = null
    public pubsub: PubSub<Events> = new PubSub<Events>()
    public files: Record<string, CodeFile> = {}

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

    addModule(moduleName: string, code: string): CodeFile {
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

    async runModules<const T extends string[]>(
        fileNames: T,
    ): Promise<Record<T[number], PromiseSettledResult<Scope>>> {
        await this.runningPromise

        const runningPromise = Promise.allSettled(
            fileNames.map((n) => this.files[n].run()),
        )

        this.runningPromise = runningPromise.then(() => {})

        const entries = Object.fromEntries(
            (await runningPromise).map((r, i) => [fileNames[i], r]),
        ) as Record<T[number], PromiseSettledResult<Scope>>

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

    public getMentionRules(): Rule[] {
        return Object.values(this.files).flatMap(
            (codeFile) => codeFile.mentionRules || [],
        )
    }
}
