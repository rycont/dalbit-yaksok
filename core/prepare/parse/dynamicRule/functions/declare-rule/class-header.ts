import {
    UnexpectedEndOfCodeError,
    UnexpectedTokenError,
} from '../../../../../error/prepare.ts'
import { TOKEN_TYPE, type Token } from '../../../../tokenize/token.ts'

type InheritanceStyle = 'none' | 'comma' | 'parenthesis'

export interface ParsedClassHeader {
    name: string
    parentName?: string
    inheritanceStyle: InheritanceStyle
}

function meaningfulTokens(headerTokens: Token[]): Token[] {
    return headerTokens.filter(
        (token) =>
            token.type !== TOKEN_TYPE.SPACE &&
            token.type !== TOKEN_TYPE.NEW_LINE,
    )
}

export function parseClassHeaderTokens(headerTokens: Token[]): ParsedClassHeader {
    const tokens = meaningfulTokens(headerTokens)
    const lastToken = tokens[tokens.length - 1]

    if (tokens.length === 0) {
        throw new UnexpectedEndOfCodeError({
            resource: {
                expected: '클래스 이름',
            },
        })
    }

    const nameToken = tokens[0]
    if (nameToken.type !== TOKEN_TYPE.IDENTIFIER) {
        throw new UnexpectedTokenError({
            resource: {
                parts: '클래스 이름',
            },
            tokens: [nameToken],
        })
    }

    const name = nameToken.value
    if (tokens.length === 1) {
        return {
            name,
            inheritanceStyle: 'none',
        }
    }

    const separatorToken = tokens[1]
    if (separatorToken.type === TOKEN_TYPE.COMMA) {
        const parentNameToken = tokens[2]
        if (!parentNameToken) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '부모 클래스 이름',
                },
                position: lastToken?.position,
            })
        }

        if (parentNameToken.type !== TOKEN_TYPE.IDENTIFIER) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '부모 클래스 이름',
                },
                tokens: [parentNameToken],
            })
        }

        const trailing = tokens[3]
        if (trailing) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '클래스 선언의 끝',
                },
                tokens: [trailing],
            })
        }

        return {
            name,
            parentName: parentNameToken.value,
            inheritanceStyle: 'comma',
        }
    }

    if (separatorToken.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
        const parentNameToken = tokens[2]
        if (!parentNameToken) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '부모 클래스 이름',
                },
                position: separatorToken.position,
            })
        }

        if (parentNameToken.type !== TOKEN_TYPE.IDENTIFIER) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '부모 클래스 이름',
                },
                tokens: [parentNameToken],
            })
        }

        const closing = tokens[3]
        if (!closing) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: ')',
                },
                position: parentNameToken.position,
            })
        }

        if (closing.type !== TOKEN_TYPE.CLOSING_PARENTHESIS) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '부모 클래스 선언을 닫는 괄호',
                },
                tokens: [closing],
            })
        }

        const trailing = tokens[4]
        if (trailing) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '클래스 선언의 끝',
                },
                tokens: [trailing],
            })
        }

        return {
            name,
            parentName: parentNameToken.value,
            inheritanceStyle: 'parenthesis',
        }
    }

    throw new UnexpectedTokenError({
        resource: {
            parts: '부모 클래스 구분자(, 또는 괄호)',
        },
        tokens: [separatorToken],
    })
}
