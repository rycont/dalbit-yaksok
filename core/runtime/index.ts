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
        config: Partial<RuntimeConfig>,
        public baseContext?: CodeFile,
    ) {
        for (const _event in config.events) {
            const event = _event as keyof Events
            this.pubsub.sub(event as keyof Events, config.events[event])
        }

        this.stdout = config.stdout || DEFAULT_RUNTIME_CONFIG.stdout
        this.stderr = config.stderr || DEFAULT_RUNTIME_CONFIG.stderr
        this.runFFI = config.runFFI || DEFAULT_RUNTIME_CONFIG.runFFI
        this.executionDelay =
            config.executionDelay || DEFAULT_RUNTIME_CONFIG.executionDelay

        this.entryPoint = config.entryPoint || DEFAULT_RUNTIME_CONFIG.entryPoint
        this.flags = config.flags || DEFAULT_RUNTIME_CONFIG.flags

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

        if (!codeFile) {
            // 파일 이름이 아니라 코드로 간주
            const temporaryEntryPoint = '__temp_main__'
            this.entryPoint = temporaryEntryPoint
            codeFile = new CodeFile(fileNameOrCode, temporaryEntryPoint)
            codeFile.mount(this)
            // this.files에 임시 파일을 추가하지 않도록 주의
            isTemporaryFile = true
            // CodeFile.mount()가 this.files에 등록하므로, 임시 파일인 경우 여기서 바로 실행 후 제거
        }

        try {
            const result = await codeFile.run()
            if (isTemporaryFile) {
                delete this.files[codeFile.name] // 임시 파일 실행 후 제거
                // 임시 파일을 실행한 경우 entryPoint를 이전 값으로 되돌리거나,
                // 사용자가 다음 run 호출 시 명시적으로 파일명을 지정하도록 유도해야 함.
                // 여기서는 entryPoint가 임시 파일명으로 남아있는 상태.
                // 또는, 생성자에서 초기 entryPoint를 저장해두고 복원하는 방법도 고려 가능.
            }
            return result
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
            }
            if (isTemporaryFile) {
                delete this.files[codeFile.name] // 에러 발생 시에도 임시 파일 제거
            }
            throw e
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
