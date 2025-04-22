import { YaksokError } from './common.ts'

export class ErrorGroups extends Error {
    constructor(public errors: Map<string, YaksokError[]>) {
        super('여러 오류가 발생했습니다.')
        this.name = 'ErrorGroups'
    }
}
