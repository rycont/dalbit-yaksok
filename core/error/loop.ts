import { valueTypeToText, YaksokError } from './common.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'

export class BreakNotInLoopError extends YaksokError {
    constructor(props: { tokens: Token[]; resource?: unknown }) {
        super(props)
        this.message = `"반복 그만"은 반복문 안에서만 사용할 수 있어요.`
    }
}

export class LoopCountIsNotNumberError extends YaksokError {
    constructor(props: { tokens: Token[]; value: ValueType }) {
        super(props)
        this.message = `반복 횟수는 숫자여야 해요. ${valueTypeToText(
            props.value,
        )}는 숫자가 아니에요.`
    }
}

export class LoopWithoutBodyError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `반복문에 실행할 내용이 없어요.`
    }
}
