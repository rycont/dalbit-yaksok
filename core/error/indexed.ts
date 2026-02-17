import type { Evaluable } from '../node/base.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'
import type { ValueType } from '../value/base.ts'
import { StringValue } from '../value/primitive.ts'
import {
    bold,
    dim,
    evaluableToText,
    valueTypeToText,
    YaksokError,
} from './common.ts'

export class IndexKeyNotFoundError extends YaksokError {
    constructor(props: {
        position?: Position
        resource: {
            index: string | number
            target: ValueType
        }
        tokens?: Token[]
    }) {
        super(props)
        this.message = `${valueTypeToText(props.resource.target)}에는 ${
            bold(props.resource.index) +
            dim(
                `(${typeof props.resource.index === 'number' ? '숫자' : '문자'})`,
            )
        }라는 값이 없어요. `
    }
}

export class StringIndexOutOfRangeError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            index: number
            length: number
            target: StringValue
        }
    }) {
        super(props)

        const targetText = props.resource.target.toPrint()
        this.message = `${targetText}에서 ${props.resource.index}번째 글자를 가져올 수 없어요. ${targetText}의 길이는 ${props.resource.length}이에요.`
    }
}

export class NotEnumerableValueForListLoopError extends YaksokError {
    constructor(props: {
        tokens: Token[]
        resource: {
            value: ValueType
        }
    }) {
        super(props)
        this.message = `${valueTypeToText(
            props.resource.value,
        )}는 목록 반복문에서 사용할 수 없어요. 목록 반복문에서는 목록을 사용해야 해요.`
    }
}
export class ListIndexMustBeGreaterOrEqualThan0Error extends YaksokError {
    constructor(props: {
        position?: Position

        resource: {
            index: number
        }
    }) {
        super(props)
        this.message = `목록의 인덱스는 0보다 크거나 같아야 해요. ${props.resource.index}는 그렇지 않아요.`
    }
}

export class RangeEndMustBeNumberError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            end: ValueType
        }
    }) {
        super(props)
        this.message = `범위의 끝은 숫자여야 해요. ${valueTypeToText(
            props.resource.end,
        )}는 숫자가 아니에요.`
    }
}

export class RangeStartMustBeLessThanEndError extends YaksokError {
    constructor(props: {
        position?: Position

        resource: {
            start: number
            end: number
        }
    }) {
        super(props)
        this.message = `범위의 시작은 끝보다 작아야 해요. ${props.resource.start}는 ${props.resource.end}보다 크거나 같아요.`
    }
}

export class ListIndexTypeError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            index: string | number
        }
    }) {
        super(props)
        this.message = `목록의 인덱스는 정수여야 해요. ${props.resource.index}는 정수가 아니에요.`
    }
}

export class RangeStartMustBeNumberError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource: {
            start: ValueType
        }
    }) {
        super(props)
        this.message = `범위의 시작은 숫자여야 해요. ${valueTypeToText(
            props.resource.start,
        )}는 숫자가 아니에요.`
    }
}

export class TupleNotMutableError extends YaksokError {
    constructor(props: {
        tokens?: Token[]
        resource?: Record<string, unknown>
    }) {
        super(props)
        this.message = `튜플은 한 번 만들면 값을 바꿀 수 없어요.`
    }
}

export class TargetIsNotIndexedValueError extends YaksokError {
    constructor(props: {
        tokens: Token[]
        resource: {
            target: Evaluable
        }
    }) {
        super(props)
        this.message = `${evaluableToText(
            props.resource.target,
        )}는 인덱스로 값을 가져올 수 없어요.`
    }
}
