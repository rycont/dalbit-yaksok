import { YaksokError } from '../error/common.ts'
import { ErrorGroups } from '../error/validation.ts'
import { CodeFile } from '../type/code-file.ts'
import { ValueType } from '../value/base.ts'

export interface FunctionInvokingParams {
    [key: string]: ValueType
}

interface RunModuleResultBase {
    codeFile: CodeFile
}

interface SuccessRunModuleResult extends RunModuleResultBase {
    reason: 'finish'
}

interface AbortedRunModuleResult extends RunModuleResultBase {
    reason: 'aborted'
}

interface ErrorRunModuleResult extends RunModuleResultBase {
    reason: 'error'
    error: YaksokError
}

interface ValidationRunModuleResult extends RunModuleResultBase {
    reason: 'validation'
    errors: ErrorGroups
}

export type RunModuleResult =
    | SuccessRunModuleResult
    | AbortedRunModuleResult
    | ErrorRunModuleResult
    | ValidationRunModuleResult
