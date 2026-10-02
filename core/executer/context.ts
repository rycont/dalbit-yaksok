import { CodeFile } from '@dalbit-yaksok/core'

export interface RuntimeContext {
    throttle: number
    abort: AbortController
    entry: Set<CodeFile>
}
