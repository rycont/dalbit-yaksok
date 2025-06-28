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

    async runModule(moduleName: string, code: string): Promise<void> {
        if (this.files[moduleName]) {
            // TODO: 더 적절한 에러 타입 정의 필요
            throw new Error(`Module "${moduleName}" already exists.`)
        }
        const codeFile = new CodeFile(code, moduleName)
        codeFile.mount(this)
        this.files[moduleName] = codeFile
        this.entryPoint = moduleName // 모듈 로드 후 entryPoint를 해당 모듈로 설정

        try {
            await codeFile.run()
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
            }
            throw e
        }
    }

    validate() {
        const validationErrors = new Map(
            Object.entries(this.files).map(([fileName, codeFile]) => [
                fileName,
                codeFile.validate().errors,
            ]),
        )

        const hasError = [...validationErrors.values()].flat().length > 0

        if (!hasError) {
            return
        }

        throw new ErrorGroups(validationErrors)
    }

    async run(
        fileNameOrCode: string = this.entryPoint,
    ): Promise<ExecuteResult<Block>> {
        let codeFile: CodeFile | undefined = this.files[fileNameOrCode]
        let isTemporaryFile = false
        const originalEntryPoint = this.entryPoint

        if (!codeFile) { // 파일이 this.files에 존재하지 않는 경우
            // 시나리오 1: run() 또는 run(entryPoint명)으로 호출되었는데, 해당 entryPoint 파일이 실제로 없는 경우
            if (fileNameOrCode === originalEntryPoint && !this.files[originalEntryPoint]) {
                throw new FileForRunNotExistError({
                    resource: { fileName: originalEntryPoint, files: Object.keys(this.files) },
                });
            }
            // 시나리오 2: run("someFile.yak")으로 호출되었는데, someFile.yak이 없는 경우
            else if (fileNameOrCode !== originalEntryPoint && fileNameOrCode.endsWith('.yak') && !this.files[fileNameOrCode]) {
                 throw new FileForRunNotExistError({
                    resource: { fileName: fileNameOrCode, files: Object.keys(this.files) },
                });
            }
            // 위 두 시나리오에 해당하지 않으면 코드로 간주
            else {
                const temporaryEntryPoint = `__temp_main__${Date.now()}`
                this.entryPoint = temporaryEntryPoint
                codeFile = new CodeFile(fileNameOrCode, temporaryEntryPoint)
                codeFile.mount(this)
                isTemporaryFile = true
            }
        } else { // 파일이 존재하는 경우
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
