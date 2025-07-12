import type { Token } from '../prepare/tokenize/token.ts'

import { YaksokError, blue, bold, dim } from './common.ts'

export class FFIResultTypeIsNotForYaksokError extends YaksokError {
    constructor(props: { value: any; ffiName: string; tokens: Token[] }) {
        super(props)

        let stringValue = ''

        if (!props.value) {
            stringValue = 'undefined'
        } else if (typeof props.value === 'string') {
            stringValue = props.value
        } else if (
            props.value.constructor &&
            props.value.constructor.toString
        ) {
            stringValue = props.value.toString()
        } else {
            stringValue = JSON.stringify(props.value)
        }

        this.message = `번역 ${bold(
            blue('"' + props.ffiName + '"'),
        )}의 결과값 ${bold(
            blue(stringValue),
        )}는 약속에서 사용할 수 있는 값이 아니에요. 결과값은 IndexedValue, 혹은 PrimitiveValue${dim(
            '(NumberValue, StringValue, BooleanValue)',
        )}여야 해요.`
    }
}

export class ErrorInFFIExecution extends YaksokError {
    constructor(props: { message: string }) {
        super({})
        this.message = props.message
    }
}

export class ErrorOccurredWhileRunningFFIExecution extends YaksokError {
    constructor(props: {
        ffiName: string
        tokens: Token[]
        child: YaksokError
    }) {
        super(props)
        this.child = props.child

        this.message = `번역 ${bold(
            blue('("' + props.ffiName + '")'),
        )}을 실행 중에 문제가 발생했어요.`
    }
}
