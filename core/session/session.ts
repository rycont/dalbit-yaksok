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

import type { EnabledFlags } from '../constant/feature-flags.ts'
import type { Extension } from '../extension/extension.ts'
import type { ValueType } from '../value/base.ts'

export class YaksokSession {
    private BASE_CONTEXT_SYMBOL = Symbol('baseContext')

    public stdout: SessionConfig['stdout']
    public stderr: SessionConfig['stderr']
    public executionDelay: SessionConfig['executionDelay']
    public flags: Partial<EnabledFlags> = {}
    public extensions: Extension[] = []
    public baseContext?: CodeFile

    public pubsub: PubSub<Events> = new PubSub<Events>()
    public files: Record<string | symbol, CodeFile> = {}

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
    }

    addModule(moduleName: string | symbol, code: string): CodeFile {
        if (this.files[moduleName]) {
            throw new AlreadyRegisteredModuleError({
                resource: { moduleName: moduleName.toString() },
            })
            // TODO: 더 적절한 에러 타입 정의 필요
            // throw new Error(`Module "${moduleName}" already exists.`)
        }
        const codeFile = new CodeFile(code, moduleName)
        codeFile.mount(this)

        this.files[moduleName] = codeFile
        // addModule은 entryPoint를 변경하지 않음
        return codeFile
    }

    addModules(modules: Record<string, string>): void {
        for (const [moduleName, code] of Object.entries(modules)) {
            this.addModule(moduleName, code)
        }
    }

    async extend(extension: Extension): Promise<void> {
        this.extensions.push(extension)
        await extension.init()
    }

    async runModule(moduleName: string | symbol): Promise<CodeFile> {
        const codeFile = this.files[moduleName]
        if (!codeFile) {
            throw new FileForRunNotExistError({
                resource: {
                    fileName: moduleName.toString(),
                    files: Object.keys(this.files),
                },
            })
        }

        try {
            this.validate(moduleName)
            await codeFile.run()
            return codeFile
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
            }

            if (e instanceof ErrorGroups) {
                const errors = e.errors

                for (const [fileName, errorList] of errors) {
                    const codeFile = this.getCodeFile(fileName)

                    for (const error of errorList) {
                        error.codeFile = codeFile
                        this.stderr(renderErrorString(error))
                    }
                }
            }

            if (e instanceof YaksokError) {
                this.stderr(renderErrorString(e))
            }

            throw e
        }
    }

    async setBaseContext(code: string) {
        this.addModule(this.BASE_CONTEXT_SYMBOL, code)
        this.baseContext = await this.runModule(this.BASE_CONTEXT_SYMBOL)
    }

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
        const result = await extension.executeFFI(code, args)

        return result
    }
}

export async function yaksok(
    code: string | Record<string, string>,
): Promise<CodeFile> {
    const session = new YaksokSession()

    if (typeof code === 'string') {
        session.addModule('main', code)
    } else {
        for (const [fileName, fileCode] of Object.entries(code)) {
            session.addModule(fileName, fileCode)
        }
    }

    const result = await session.runModule('main')
    return result
}
