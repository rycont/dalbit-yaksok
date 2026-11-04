import {
    AlreadyRegisteredModuleError,
    CodeFile,
    ErrorInFFIExecution,
    FFIRuntimeNotFound,
    MultipleFFIRuntimeError,
    Node,
    Scope,
    ValueType,
    YaksokError,
    PubSub,
    type Rule,
    type Extension,
    type RuntimeContext,
} from '@dalbit-yaksok/core'

const THREAD_YIELD_INTERVAL = 300

export class YaksokSession {
    public id: string = crypto.randomUUID()

    public stdout: (message: string) => void
    public stderr: (message: string, error: YaksokError) => void

    public extensions: Extension[] = []
    public baseScope: Scope | null = null

    public files: Record<string, CodeFile> = {}
    public runtimeContext: RuntimeContext | null = null

    private tickCounter = 0

    public eventCreation: PubSub<{
        [key: string]: (
            args: Map<string, ValueType>,
            callback: () => Promise<void>,
            terminate: () => void,
            scope: Scope,
        ) => void
    }> = new PubSub()

    public aliveListeners: Promise<void>[] = []

    constructor({
        stderr = (message: string) => {
            console.error(message)
        },
        stdout = console.log,
    }: Partial<{
        stdout: YaksokSession['stdout']
        stderr: YaksokSession['stderr']
    }> = {}) {
        this.stdout = stdout
        this.stderr = stderr
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

        for (const { fileName, code, baseScope } of extension.capabilties
            .File || []) {
            const ranScope = await this.addModule(fileName, code).run()
            if (baseScope) {
                this.useBaseScope(ranScope)
            }
        }
    }

    public useBaseScope(scope: Scope): void {
        this.baseScope = scope
    }

    async runModules<const T extends string[]>(
        fileNames: T,
    ): Promise<Record<T[number], PromiseSettledResult<Scope>>> {
        const codeFiles = fileNames.map((n) => this.files[n])
        const run = await this.withRuntimeContext(
            (c) =>
                Promise.allSettled(
                    codeFiles.map((codeFile) => codeFile.run(c)),
                ),
            {
                entry: new Set(codeFiles),
            },
        )

        const entries = Object.fromEntries(
            run.map((r, i) => [fileNames[i], r]),
        ) as Record<T[number], PromiseSettledResult<Scope>>

        return entries
    }

    public withRuntimeContext<T>(
        func: (content: RuntimeContext) => Promise<T>,
        providedContext: Partial<RuntimeContext> &
            Pick<RuntimeContext, 'entry'>,
    ): Promise<T> {
        if (this.runtimeContext && this.runtimeContext !== providedContext) {
            throw new Error('이전에 실행한 세션이 아직 종료되지 않았습니다.')
        }

        const context = {
            throttle: providedContext.throttle ?? 0,
            abort: new AbortController(),
            entry: providedContext.entry,
        }

        this.runtimeContext = context

        return func(context).finally(() => {
            this.runtimeContext = null
        })
    }

    public async runFFI(
        runtime: string,
        code: string,
        args: Map<string, ValueType>,
        callerScope: Scope,
    ): Promise<ValueType> {
        const foundCapabilities = this.extensions.flatMap(
            (ext) =>
                ext.capabilties.FFI?.filter((c) => c.runtimeId === runtime) ||
                [],
        )

        if (foundCapabilities.length === 0) {
            throw new FFIRuntimeNotFound({
                resource: { runtimeName: runtime },
            })
        }

        if (foundCapabilities.length > 1) {
            throw new MultipleFFIRuntimeError({
                resource: { runtimeName: runtime },
            })
        }

        const capability = foundCapabilities[0]

        try {
            const result = await capability.run(code, args, callerScope)
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
                message: `FFI 실행 중 알 수 없는 오류 발생: ${String(error)}`,
            })
        }
    }

    public async tick(): Promise<void> {
        if (this.tickCounter++ % THREAD_YIELD_INTERVAL === 0) {
            await new Promise((ok) => setTimeout(ok, 0))
        }
    }

    public getMentionRules(): Rule<Node[]>[] {
        return Object.values(this.files).flatMap(
            (codeFile) => codeFile.mentionRules || [],
        )
    }
}
