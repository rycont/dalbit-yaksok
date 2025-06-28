import {
    DEFAULT_RUNTIME_CONFIG,
    Events,
    type RuntimeConfig,
} from './runtime-config.ts'
import { FileForRunNotExistError } from '../error/prepare.ts'
import { renderErrorString } from '../error/render-error-string.ts'
import { YaksokError } from '../error/common.ts'
import { CodeFile } from '../type/code-file.ts'

import type { EnabledFlags } from '../constant/feature-flags.ts'
import type { ExecuteResult } from '../executer/index.ts'
import type { Block } from '../node/block.ts'
import { PubSub } from '../util/pubsub.ts'
import { Scope } from '../executer/scope.ts'
import { ErrorGroups } from '../error/validation.ts'

export class YaksokSession {
    public stdout: RuntimeConfig['stdout']
    public stderr: RuntimeConfig['stderr']
    public entryPoint: RuntimeConfig['entryPoint']
    public runFFI: RuntimeConfig['runFFI']
    public executionDelay: RuntimeConfig['executionDelay']
    public flags: Partial<EnabledFlags> = {}

    public pubsub: PubSub<Events> = new PubSub<Events>()
    public files: Record<string, CodeFile> = {}

    constructor(
        codeTexts: Record<string, string> = {},
        config: Partial<RuntimeConfig> = {},
        public baseContext?: CodeFile,
    ) {
        const resolvedConfig = { ...DEFAULT_RUNTIME_CONFIG, ...config }

        for (const _event in resolvedConfig.events) {
            const event = _event as keyof Events
            this.pubsub.sub(event as keyof Events, resolvedConfig.events[event])
        }

        this.stdout = resolvedConfig.stdout
        this.stderr = resolvedConfig.stderr
        this.runFFI = resolvedConfig.runFFI
        this.executionDelay = resolvedConfig.executionDelay
        this.flags = resolvedConfig.flags

        if (resolvedConfig.entryPoint && codeTexts[resolvedConfig.entryPoint]) {
            this.entryPoint = resolvedConfig.entryPoint
        } else if (codeTexts && Object.keys(codeTexts).length > 0) {
            this.entryPoint = Object.keys(codeTexts)[0]
        } else {
            this.entryPoint = resolvedConfig.entryPoint
        }

        for (const [fileName, text] of Object.entries(codeTexts)) {
            const codeFile = new CodeFile(text, fileName)
            codeFile.mount(this)
            this.files[fileName] = codeFile
        }
    }

    addModule(moduleName: string, code: string): CodeFile {
        if (this.files[moduleName]) {
            // TODO: 더 적절한 에러 타입 정의 필요
            throw new Error(`Module "${moduleName}" already exists.`)
        }
        const codeFile = new CodeFile(code, moduleName)
        codeFile.mount(this)
        this.files[moduleName] = codeFile
        // addModule은 entryPoint를 변경하지 않음
        return codeFile
    }

    async runModule(moduleName: string): Promise<ExecuteResult<Block>> {
        const codeFile = this.files[moduleName]
        if (!codeFile) {
            throw new FileForRunNotExistError({
                resource: {
                    fileName: moduleName,
                    files: Object.keys(this.files),
                },
            })
        }
        this.entryPoint = moduleName // 실행하려는 모듈을 entryPoint로 설정

        try {
            return await codeFile.run()
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
            }
            throw e
        }
    }

    validate(entrypoint?: string): void {
        const filesToValidate: Record<string, CodeFile> = {};
        if (entrypoint) {
            if (this.files[entrypoint]) {
                filesToValidate[entrypoint] = this.files[entrypoint];
            } else {
                throw new FileForRunNotExistError({ // 또는 다른 적절한 오류 타입
                    resource: {
                        fileName: entrypoint,
                        files: Object.keys(this.files),
                    },
                });
            }
        } else {
            Object.assign(filesToValidate, this.files);
        }

        const validationErrors = new Map(
            Object.entries(filesToValidate).map(([fileName, codeFile]) => [
                fileName,
                codeFile.validate().errors,
            ]),
        );

        const allErrors = [...validationErrors.values()].flat();
        if (allErrors.length > 0) {
            throw new ErrorGroups(validationErrors);
        }
    }

    async run(
        fileNameOrCode: string = this.entryPoint,
    ): Promise<ExecuteResult<Block>> {
        let codeFile: CodeFile | undefined = this.files[fileNameOrCode]
        let isTemporaryFile = false
        const originalEntryPoint = this.entryPoint

        if (!codeFile) {
            const isExplictFileRunAttempt =
                (fileNameOrCode === originalEntryPoint && !this.files[originalEntryPoint]) ||
                (fileNameOrCode.endsWith('.yak') && !this.files[fileNameOrCode]); // 명시적으로 .yak 파일을 실행하려 했지만 없는 경우도 포함

            if (isExplictFileRunAttempt) {
                throw new FileForRunNotExistError({
                    resource: {
                        fileName: fileNameOrCode,
                        files: Object.keys(this.files),
                    },
                })
            }
            else { // 코드로 간주
                const temporaryEntryPoint = `__temp_main__${Date.now()}`
                this.entryPoint = temporaryEntryPoint
                codeFile = new CodeFile(fileNameOrCode, temporaryEntryPoint)
                codeFile.mount(this)
                isTemporaryFile = true
            }
        } else {
            this.entryPoint = fileNameOrCode
        }

        try {
            const result = await codeFile.run()
            return result
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
            }
            throw e
        } finally {
            if (isTemporaryFile && codeFile) {
                delete this.files[codeFile.fileName]
                if (this.files[originalEntryPoint]) {
                    this.entryPoint = originalEntryPoint
                } else if (this.baseContext && this.files[this.baseContext.fileName]) {
                    this.entryPoint = this.baseContext.fileName
                } else {
                    const availableFiles = Object.keys(this.files)
                    this.entryPoint = availableFiles.length > 0 ? availableFiles[0] : DEFAULT_RUNTIME_CONFIG.entryPoint
                }
            }
        }
    }

    public getCodeFile(fileName: string = this.entryPoint): CodeFile {
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
}

export async function yaksok(
    code: string | Record<string, string>,
    config: Partial<RuntimeConfig> = {},
    baseContext?: CodeFile,
): Promise<{
    runtime: YaksokSession
    mainScope: Scope
    codeFiles: Record<string, CodeFile>
}> {
    let runtime: YaksokSession

    if (typeof code === 'string') {
        runtime = new YaksokSession({ main: code }, config, baseContext)
    } else {
        runtime = new YaksokSession(code, config, baseContext)
    }

    try {
        runtime.validate()
        await runtime.run()

        return {
            runtime,
            mainScope: runtime.getCodeFile().runResult!.scope,
            codeFiles: runtime.files,
        }
    } catch (e) {
        if (e instanceof ErrorGroups) {
            const errors = e.errors

            for (const [fileName, errorList] of errors) {
                const codeFile = runtime.getCodeFile(fileName)

                for (const error of errorList) {
                    error.codeFile = codeFile
                    runtime.stderr(renderErrorString(error))
                }
            }
        }

        if (e instanceof YaksokError) {
            runtime.stderr(renderErrorString(e))
        }

        throw e
    }
}
