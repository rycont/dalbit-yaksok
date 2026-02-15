import { YaksokError } from "../error/common.ts";
import {
  AlreadyRegisteredModuleError,
  FFIRuntimeNotFound,
  FileForRunNotExistError,
  MultipleFFIRuntimeError,
} from "../error/prepare.ts";
import {
  errorToMachineReadable,
  renderErrorString,
} from "../error/render-error-string.ts";
import { CodeFile, CodeFileConfig } from "../type/code-file.ts";
import { PubSub } from "../util/pubsub.ts";
import {
  DEFAULT_SESSION_CONFIG,
  type Events,
  type SessionConfig,
} from "./session-config.ts";

import type { EnabledFlags } from "../constant/feature-flags.ts";
import {
  AbortedRunModuleResult,
  ErrorRunModuleResult,
  FunctionInvokingParams,
  RunModuleResult,
  SuccessRunModuleResult,
  ValidationRunModuleResult,
} from "../constant/type.ts";
import { AbortedSessionSignal } from "../executer/signals.ts";
import type { Extension } from "../extension/extension.ts";
import type { ValueType } from "../value/base.ts";
import type { Node } from "../node/base.ts";
import type { Scope } from "../executer/scope.ts";
import { ErrorGroups } from "../error/validation.ts";
import { ErrorInFFIExecution } from "../error/ffi.ts";

/**
 * 인터프리터 실행 진입점 세션입니다.
 *
 * 모듈 등록/실행과 입출력, 확장(FFI), 런타임 이벤트를 관리합니다.
 */
export class YaksokSession {
  /** base context 모듈을 식별하기 위한 내부 심볼 */
  readonly #BASE_CONTEXT_SYMBOL = Symbol("baseContext");
  public get BASE_CONTEXT_SYMBOL(): symbol {
    return this.#BASE_CONTEXT_SYMBOL;
  }

  /** 현재 실행 중인 runModule Promise */
  public runningPromise: Promise<RunModuleResult[]> | null = null;
  /** `보여주기` 출력 훅 */
  public stdout: SessionConfig["stdout"];
  /** `입력받기` 입력 훅 */
  public stdin: SessionConfig["stdin"];
  /** 에러 출력 훅 */
  public stderr: SessionConfig["stderr"];
  /** 런타임 기능 플래그 */
  public flags: Partial<EnabledFlags> = {};
  /** FFI 확장 목록 */
  public extensions: Extension[] = [];
  /** base context 체인 */
  public baseContexts: CodeFile[] = [];
  public get baseContext(): CodeFile | undefined {
    return this.baseContexts[this.baseContexts.length - 1];
  }
  /** 외부 중단 시그널 */
  public signal: AbortSignal | null = null;
  /** 실행 일시정지 여부 */
  public paused: boolean = false;
  public stepByStep: boolean = false;
  public stepUnit: (new (...args: any[]) => Node) | null = null;
  public canRunNode:
    | ((scope: Scope, node: Node) => Promise<boolean> | boolean)
    | null = null;
  /** 세션 이벤트 버스 */
  public pubsub: PubSub<Events> = new PubSub<Events>();
  /** 세션에 등록된 모듈 저장소 */
  public files: Record<string | symbol, CodeFile> = {};

  private tick = 0;
  private threadYieldInterval: number;

  public eventCreation: PubSub<{
    [key: string]: (
      args: FunctionInvokingParams,
      callback: () => void,
      terminate: () => void,
    ) => void;
  }> = new PubSub();

  public aliveListeners: Promise<void>[] = [];

  constructor(config: Partial<SessionConfig> = {}) {
    const resolvedConfig = { ...DEFAULT_SESSION_CONFIG, ...config };

    for (const _event in resolvedConfig.events) {
      const event = _event as keyof Events;
      this.pubsub.sub(
        event as keyof Events,
        resolvedConfig.events[event as keyof Events]!,
      );
    }

    this.stdout = resolvedConfig.stdout;
    this.stdin = resolvedConfig.stdin;
    this.stderr = resolvedConfig.stderr;
    this.flags = resolvedConfig.flags;
    this.signal = resolvedConfig.signal ?? null;
    this.threadYieldInterval = resolvedConfig.threadYieldInterval;
    this.stepUnit = resolvedConfig.stepUnit ?? null;
    this.canRunNode = resolvedConfig.canRunNode ?? null;
  }

  addModule(
    moduleName: string | symbol,
    code: string,
    codeFileConfig: Partial<CodeFileConfig> = {},
  ): CodeFile {
    if (this.files[moduleName]) {
      throw new AlreadyRegisteredModuleError({
        resource: { moduleName: moduleName.toString() },
      });
    }

    const codeFile = new CodeFile(code, moduleName);
    codeFile.executionDelay = codeFileConfig.executionDelay ?? null;
    codeFile.mount(this);

    this.files[moduleName] = codeFile;
    return codeFile;
  }

  addModules(modules: Record<string, string>): void {
    for (const [moduleName, code] of Object.entries(modules)) {
      this.addModule(moduleName, code);
    }
  }

  async extend(extension: Extension): Promise<void> {
    this.extensions.push(extension);
    if (extension.manifest.module) {
      const { module } = extension.manifest;
      for (const [name, code] of Object.entries(module)) {
        this.addModule(name, code);
      }
    }
    await extension.init?.();
  }

  private async runOneModule(
    moduleName: string | symbol,
  ): Promise<RunModuleResult> {
    const codeFile = this.files[moduleName];
    if (!codeFile) {
      return {
        reason: "error",
        error: new FileForRunNotExistError({
          resource: {
            fileName: moduleName.toString(),
            files: Object.keys(this.files),
          },
        }),
      };
    }

    try {
      const validationErrors = this.validate(moduleName);
      const allErrors = [...validationErrors.values()].flat();

      if (allErrors.length > 0) {
        for (
          const [
            fileName,
            validationErrorList,
          ] of validationErrors.entries()
        ) {
          const codeFile = this.getCodeFile(fileName);

          for (const error of validationErrorList) {
            error.codeFile = codeFile;
            this.stderr(
              renderErrorString(error),
              errorToMachineReadable(error),
            );
          }
        }

        return {
          codeFile,
          reason: "validation",
          errors: validationErrors,
        } as ValidationRunModuleResult;
      }

      const result = codeFile.run();
      await result;
      await Promise.all(this.aliveListeners);

      return {
        codeFile,
        reason: "finish",
      } as SuccessRunModuleResult;
    } catch (e) {
      if (e instanceof YaksokError) {
        if (!e.codeFile) {
          e.codeFile = codeFile;
        }
        this.stderr(renderErrorString(e), errorToMachineReadable(e));
        return {
          codeFile,
          reason: "error",
          error: e,
        } as ErrorRunModuleResult;
      }

      if (e instanceof AbortedSessionSignal) {
        return {
          codeFile,
          reason: "aborted",
        } as AbortedRunModuleResult;
      }

      throw e;
    } finally {
      this.runningPromise = null;
    }
  }

  async runModule(
    moduleName: string | symbol | (string | symbol)[],
  ): Promise<Map<string | symbol, RunModuleResult>> {
    if (this.runningPromise) {
      await this.runningPromise;
    }

    const runModuleNames = Array.isArray(moduleName)
      ? moduleName
      : [moduleName];

    this.runningPromise = Promise.all(
      runModuleNames.map((n) => this.runOneModule(n)),
    );

    const entries = (await this.runningPromise).map((result, index) =>
      [
        runModuleNames[index],
        result,
      ] as const
    );

    return new Map(entries);
  }

  async setBaseContext(code: string): Promise<RunModuleResult> {
    const moduleName = Symbol(`baseContext-${this.baseContexts.length}`);
    this.addModule(moduleName, code);

    const results = await this.runModule(moduleName);
    const result = results.get(moduleName)!;

    if (result.reason === "finish") {
      this.baseContexts.push(result.codeFile);
    }

    return result;
  }

  validate(fileName?: string | symbol): ErrorGroups {
    const filesToValidate: Record<string | symbol, CodeFile> = {};
    if (fileName) {
      if (this.files[fileName]) {
        filesToValidate[fileName] = this.files[fileName];
      } else {
        throw new FileForRunNotExistError({
          resource: {
            fileName: fileName.toString(),
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

    return validationErrors;
  }

  public getCodeFile(fileName: string | symbol): CodeFile {
    if (!this.files[fileName]) {
      throw new FileForRunNotExistError({
        resource: {
          fileName: String(fileName),
          files: Object.keys(this.files),
        },
      });
    }

    return this.files[fileName];
  }

  public async runFFI(
    runtime: string,
    code: string,
    args: Record<string, any>,
    callerScope: Scope,
  ): Promise<ValueType> {
    const availableExtensions = this.extensions.filter(
      (ext) => ext.manifest.ffiRunner?.runtimeName === runtime,
    );

    if (availableExtensions.length === 0) {
      throw new FFIRuntimeNotFound({
        resource: { runtimeName: runtime },
      });
    }

    if (availableExtensions.length > 1) {
      throw new MultipleFFIRuntimeError({
        resource: { runtimeName: runtime },
      });
    }

    const extension = availableExtensions[0];

    try {
      const result = await extension.executeFFI(code, args, callerScope);
      return result;
    } catch (error) {
      if (error instanceof ErrorInFFIExecution) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ErrorInFFIExecution({
          message: `FFI 실행 중 오류 발생: ${error.message}`,
        });
      }
      throw new ErrorInFFIExecution({
        message: `FFI 실행 중 알 수 없는 오류 발생: ${error}`,
      });
    }
  }

  public pause() {
    this.paused = true;
    this.pubsub.pub("pause", []);
  }

  public resume(): Promise<void> {
    this.paused = false;
    this.pubsub.pub("resume", []);

    if (this.runningPromise) {
      return this.runningPromise?.then();
    }

    return Promise.resolve();
  }

  public async increaseTick(): Promise<void> {
    if (this.tick++ % this.threadYieldInterval === 0) {
      await new Promise((ok) => setTimeout(ok, 0));
    }
  }
}

export async function yaksok(
  code: string | Record<string, string>,
): Promise<RunModuleResult> {
  const session = new YaksokSession();

  if (typeof code === "string") {
    session.addModule("main", code);
  } else {
    for (const [fileName, fileCode] of Object.entries(code)) {
      session.addModule(fileName, fileCode);
    }
  }

  const results = await session.runModule("main");
  return results.get("main")!;
}
