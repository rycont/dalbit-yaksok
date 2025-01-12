import { Node } from '../node/base.ts'
import { Token } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'
import { YaksokError, blue, bold, dim, tokenToText } from './common.ts'

export class CannotParseError extends YaksokError {
    constructor(props: {
        tokens: Token[]
        resource: {
            part: Node
        }
    }) {
        super(props)

        const nodeConstructor = props.resource.part.constructor as typeof Node

        try {
            this.message = `${bold(
                '"' + props.resource.part.toPrint() + '"',
            )}${dim(
                `(${nodeConstructor.friendlyName})`,
            )}는 실행할 수 있는 코드가 아니에요.`
        } catch {
            this.message = `${
                '"' + bold(nodeConstructor.friendlyName) + '"'
            }는 실행할 수 있는 코드가 아니에요.`
        }
    }
}

export class IndentIsNotMultipleOf4Error extends YaksokError {
    constructor(props: {
        position?: Position
        resource: {
            indent: number
        }
    }) {
        super(props)
        this.message = `들여쓰기는 4의 배수여야 해요. ${props.resource.indent}는 4의 배수가 아니에요.`
    }
}

export class IndentLevelMismatchError extends YaksokError {
    constructor(props: {
        position?: Position
        resource: {
            expected?: number
        }
    }) {
        super(props)
        this.message = `들여쓰기가 잘못되었어요.`

        if (props.resource.expected !== undefined) {
            this.message += ` 여기서는 ${bold(
                `"${props.resource.expected}"`,
            )}만큼 들여쓰기를 해야해요.`
        }
    }
}

interface UnexpectedCharErrorResource {
    char: string
    parts: string
}

export class UnexpectedCharError extends YaksokError<UnexpectedCharErrorResource> {
    constructor(props: {
        resource: UnexpectedCharErrorResource
        position?: Position
    }) {
        super(props)
        this.message = `문자 ${props.resource.char}는 ${props.resource.parts}에 사용할 수 없어요.`
    }
}

export class UnexpectedEndOfCodeError extends YaksokError {
    constructor(props: {
        resource?: {
            expected?: string
        }
        position?: Position
    }) {
        super(props)
        if (props.resource?.expected) {
            this.message = `${bold(
                `"${props.resource.expected}"`,
            )}가 나와야 했지만 코드가 끝났어요.`
        } else {
            this.message = `코드가 완성되지 않고 끝났어요.`
        }
    }
}

export class UnexpectedTokenError extends YaksokError {
    constructor(props: {
        resource: {
            token: Token
            parts: string
        }
        position?: Position
    }) {
        super(props)

        this.message = `${tokenToText(props.resource.token)}은 ${bold(
            props.resource.parts,
        )}에 사용할 수 없어요.`
    }
}

export class FileForRunNotExistError extends YaksokError<{
    fileName: string
}> {
    constructor(props: {
        resource: {
            fileName: string
            files: string[]
        }
    }) {
        super(props)

        if (props.resource.files.length === 0) {
            this.message = '실행할 코드가 없어요.'
        } else {
            this.message = `주어진 코드(${dim(
                props.resource.files.join(', '),
            )})에서 ${blue(
                `"${props.resource.fileName}"`,
            )} 파일을 찾을 수 없어요. `
        }
    }
}
