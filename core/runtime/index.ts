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

export class Runtime {
    public stdout: RuntimeConfig['stdout']
    public stderr: RuntimeConfig['stderr']
    public entryPoint: RuntimeConfig['entryPoint']
    public runFFI: RuntimeConfig['runFFI']
    public executionDelay: RuntimeConfig['executionDelay']
    public flags: Partial<EnabledFlags> = {}

    public pubsub: PubSub<Events> = new PubSub<Events>()
    public files: Record<string, CodeFile> = {}

    constructor(
        codeTexts: Record<string, string>,
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

    async run(fileName = this.entryPoint): Promise<ExecuteResult<Block>> {
        const codeFile = this.files[fileName]

        if (!codeFile) {
            throw new FileForRunNotExistError({
                resource: {
                    fileName: fileName,
                    files: Object.keys(this.files),
                },
            })
        }

        try {
            return await codeFile.run()
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = codeFile
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
    runtime: Runtime
    mainScope: Scope
    codeFiles: Record<string, CodeFile>
}> {
    let runtime: Runtime

    if (typeof code === 'string') {
        runtime = new Runtime({ main: code }, config, baseContext)
    } else {
        runtime = new Runtime(code, config, baseContext)
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
