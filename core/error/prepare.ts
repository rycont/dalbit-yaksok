import type { Node } from '../node/base.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { DEFAULT_SESSION_CONFIG } from '../session/session-config.ts'
import type { CodeFile } from '../type/code-file.ts'
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
        tokens: Token[]
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
        tokens?: Token[]
        resource: {
            expected?: number
        }
    }) {
        super(props)
        this.message = `들여쓰기가 잘못되었어요.`

        if (props.resource.expected === 0) {
            this.message += ` 여기선 들여쓰기를 할 필요가 없어요.`
        } else if (props.resource.expected !== undefined) {
            this.message += ` 여기서는 ${bold(
                props.resource.expected * 4 + '칸',
            )}${dim(`(또는 탭 ${props.resource.expected}번)`)} 띄어써야 해요.`
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

export class UnexpectedNewlineError extends UnexpectedCharError {
    constructor(props: { parts: string; position?: Position }) {
        super({
            resource: {
                char: '줄바꿈',
                parts: props.parts,
            },
        })
        this.message = `${bold(blue(props.parts))}엔 줄바꿈을 사용할 수 없어요.`
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
            parts: string
        }
        tokens: Token[]
        position?: Position
    }) {
        super(props)

        this.message = `${tokenToText(props.tokens[0])}은 ${bold(
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

        if (
            props.resource.files.length === 0 &&
            props.resource.fileName === DEFAULT_SESSION_CONFIG.entryPoint
        ) {
            this.message = '실행할 코드가 없어요.' // 기본 entryPoint('main')를 실행하려는데 파일이 전혀 없는 경우
        } else {
            this.message = `실행하려는 파일 ${blue(
                `"${props.resource.fileName}"`,
            )}을(를) 찾을 수 없어요. ${
                props.resource.files.length > 0
                    ? `현재 사용 가능한 파일: ${dim(
                          props.resource.files.join(', '),
                      )}`
                    : ''
            }`.trim()
        }
    }
}

export class FFIRuntimeNotFound extends YaksokError<{
    runtimeName: string
}> {
    constructor(props: {
        resource: { runtimeName: string }
        position?: Position
        tokens?: Token[]
        codeFile?: CodeFile
    }) {
        super(props)
        this.message = `번역${bold(
            '(' + props.resource.runtimeName + ')',
        )}을 처리할 수 있는 실행 환경이 없어요.`
    }
}

export class MultipleFFIRuntimeError extends YaksokError<{
    runtimeName: string
}> {
    constructor(props: {
        resource: { runtimeName: string }
        position?: Position
        tokens?: Token[]
        codeFile?: CodeFile
    }) {
        super(props)
        this.message = `번역${bold(
            '(' + props.resource.runtimeName + ')',
        )}을 처리할 수 있는 실행 환경이 여러 개 있어요. 실행 환경을 하나로 정해주세요.`
    }
}

export class AlreadyRegisteredModuleError extends YaksokError<{
    moduleName: string
}> {
    constructor(props: { resource: { moduleName: string } }) {
        super(props)
        this.message = `모듈 ${blue(
            `"${props.resource.moduleName}"`,
        )}은(는) 이미 등록되어 있어요.`
    }
}
