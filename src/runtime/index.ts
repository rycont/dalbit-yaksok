import { EnabledFlags } from '../constant/feature-flags.ts'
import { FileRunner } from './file-runner.ts'
import { DEFAULT_RUNTIME_CONFIG, RuntimeConfig } from './runtime-config.ts'
import { FileForRunNotExistError } from '../error/prepare.ts'

export class Runtime {
    stdout: RuntimeConfig['stdout']
    stderr: RuntimeConfig['stderr']
    entryPoint: RuntimeConfig['entryPoint']
    runFFI: RuntimeConfig['runFFI']
    flags: Partial<EnabledFlags> = {}

    runners: Record<string, FileRunner> = {}

    constructor(
        public files: Record<string, string>,
        config: Partial<RuntimeConfig>,
    ) {
        this.stdout = config.stdout || DEFAULT_RUNTIME_CONFIG.stdout
        this.stderr = config.stderr || DEFAULT_RUNTIME_CONFIG.stderr
        this.entryPoint = config.entryPoint || DEFAULT_RUNTIME_CONFIG.entryPoint
        this.runFFI = config.runFFI || DEFAULT_RUNTIME_CONFIG.runFFI
        this.flags = config.flags || DEFAULT_RUNTIME_CONFIG.flags
    }

    getFileRunner(fileName = this.entryPoint): FileRunner {
        if (!(fileName in this.files)) {
            throw new FileForRunNotExistError({
                resource: {
                    entryPoint: this.entryPoint,
                    files: Object.keys(this.files),
                },
            })
        }

        if (fileName in this.runners) {
            return this.runners[fileName]
        }

        this.runners[fileName] = new FileRunner(
            this.files[fileName],
            this,
            fileName,
        )

        return this.runners[fileName]
    }

    async run(fileName = this.entryPoint): Promise<FileRunner> {
        const runner = this.getFileRunner(fileName)
        await runner.run()

        return runner
    }

    async runOnce(fileName = this.entryPoint): Promise<FileRunner> {
        const runner = this.getFileRunner(fileName)
        if (!runner.ran) await runner.run()

        return runner
    }
}

export async function yaksok(
    code: string | Record<string, string>,
    config: Partial<RuntimeConfig> = {},
): Promise<Runtime> {
    const yaksok = new Runtime(
        typeof code === 'string'
            ? {
                  [DEFAULT_RUNTIME_CONFIG.entryPoint]: code,
              }
            : code,
        config,
    )

    await yaksok.run()

    return yaksok
}
