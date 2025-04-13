import { YaksokError } from './common.ts'

export class ErrorGroups {
    constructor(public errors: Map<string, YaksokError[]>) {}
}
