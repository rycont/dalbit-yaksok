import type { Token } from '../prepare/tokenize/token.ts'

import { YaksokError } from './common.ts'

export class CannotReturnOutsideFunctionError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `"약속 그만"은 약속 안에서만 사용할 수 있어요.`
    }
}

export class FunctionMustHaveOneOrMoreStringPartError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `약속(번역)을 선언할 때엔 적어도 하나의 고정되는 부분이 있어야 해요.`
    }
}
