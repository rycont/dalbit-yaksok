import { Token } from '../prepare/tokenize/token.ts'
import { YaksokError } from './common.ts'

export class UnknownNodeError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)

        this.message = '올바르지 않은 코드에요. 문법을 다시 확인해주세요.'
    }
}
