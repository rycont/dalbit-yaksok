import { blue, bold, YaksokError } from './common.ts'

import type { Token } from '../prepare/tokenize/token.ts'

export class BreakNotInLoopError extends YaksokError {
    constructor(props: { tokens: Token[]; resource?: unknown }) {
        super(props)
        this.message = `"반복 그만"은 반복문 안에서만 사용할 수 있어요.`
    }
}

export class NoBreakOrReturnError extends YaksokError {
    constructor(props: { tokens: Token[]; resource?: unknown }) {
        super(props)
        this.message = `반복문 안에 ${bold(blue('"반복 그만"'))}이나 ${bold(
            blue('"반환"'),
        )}이 없어요.`
    }
}
