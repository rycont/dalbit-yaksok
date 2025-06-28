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
        config: Partial<RuntimeConfig> = {}, // config도 선택 사항으로 변경하고 기본값 제공
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

        // entryPoint 설정 로직 개선
        if (resolvedConfig.entryPoint && codeTexts[resolvedConfig.entryPoint]) {
            this.entryPoint = resolvedConfig.entryPoint
        } else if (codeTexts && Object.keys(codeTexts).length > 0) {
            // codeTexts가 있고, 명시적 entryPoint가 없거나 유효하지 않으면 첫 번째 파일을 entryPoint로
            this.entryPoint = Object.keys(codeTexts)[0]
        } else {
            // codeTexts가 비어있거나, 명시적 entryPoint가 없으면 기본 entryPoint 사용
            this.entryPoint = resolvedConfig.entryPoint // DEFAULT_RUNTIME_CONFIG.entryPoint가 기본값
        }

        for (const [fileName, text] of Object.entries(codeTexts)) {
            const codeFile = new CodeFile(text, fileName)
            codeFile.mount(this)
            this.files[fileName] = codeFile
        }

        // codeTexts가 비어있고 entryPoint가 'main'인데 'main' 파일이 없는 경우,
        // this.entryPoint는 'main'으로 유지되지만 this.files['main']은 존재하지 않음.
        // run() 메서드 등에서 이 경우를 처리해야 함.
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
        const originalEntryPoint = this.entryPoint // 현재 entryPoint 저장

        if (!codeFile && fileNameOrCode === this.entryPoint && !Object.keys(this.files).includes(fileNameOrCode)) {
            // 실행하려는 entryPoint가 파일 목록에 없는 명시적 파일 실행 요청인 경우
            throw new FileForRunNotExistError({
                resource: {
                    fileName: fileNameOrCode,
                    files: Object.keys(this.files),
                },
            })
        }


        if (!codeFile) {
            // 파일 이름이 아니라 코드로 간주 (위의 조건에서 걸러지지 않은 경우)
            const temporaryEntryPoint = `__temp_main__${Date.now()}` // 고유한 임시 파일 이름
            this.entryPoint = temporaryEntryPoint
            codeFile = new CodeFile(fileNameOrCode, temporaryEntryPoint)
            codeFile.mount(this) // this.files에 임시 파일 등록
            isTemporaryFile = true
        } else {
            // 기존 파일을 실행하는 경우, entryPoint를 해당 파일로 설정
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
                delete this.files[codeFile.fileName] // 임시 파일 제거 (.name -> .fileName)
                // entryPoint 복원 로직:
                // 1. originalEntryPoint가 여전히 유효한 파일(this.files에 존재)이면 그것으로 복원
                // 2. 그렇지 않고, baseContext가 있고 그것이 유효한 파일이면 그것으로 복원
                // 3. 그것도 아니면, 남아있는 파일 중 첫 번째 파일을 사용
                // 4. 파일이 전혀 없으면 DEFAULT_RUNTIME_CONFIG.entryPoint (보통 'main')로 설정
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
        // getCodeFile 호출 시 this.entryPoint가 유효하지 않을 수 있는 경우 (모든 파일이 제거된 후)
        // DEFAULT_RUNTIME_CONFIG.entryPoint를 사용하거나, 오류를 발생시키는 대신 undefined를 반환하도록 고려할 수 있음.
        // 현재는 entryPoint가 this.files에 존재한다고 가정함.
        if (!this.files[fileName] && fileName === DEFAULT_RUNTIME_CONFIG.entryPoint && Object.keys(this.files).length === 0) {
             // 모든 파일이 제거되었고, entryPoint가 기본값 'main'이지만 실제 'main' 파일이 없는 경우.
             // 이 경우 YaksokSession은 실행할 파일이 없는 상태이다.
             // FileForRunNotExistError를 발생시키는 것이 적절할 수 있으나,
             // getCodeFile의 사용처에 따라 다르게 처리해야 할 수 있음.
             // 여기서는 일단 기존 로직을 유지.
        }
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
