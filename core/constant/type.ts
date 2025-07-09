import { YaksokError } from '../error/common.ts'
import { ErrorGroups } from '../error/validation.ts'
import { CodeFile } from '../type/code-file.ts'
import { ValueType } from '../value/base.ts'

export interface FunctionInvokingParams {
    [key: string]: ValueType
}

export type RunModuleResult = {
    codeFile: CodeFile
} & (
    | {
          reason: 'finish'
      }
    | {
          reason: 'aborted'
      }
    | {
          reason: 'error'
          error: YaksokError
      }
    | {
          reason: 'validation'
          errors: ErrorGroups
      }
)
