import { Expression, Identifier, Node, Operator } from '../../node/base.ts'
import { FFIBody } from '../../node/ffi.ts'
import { Mention } from '../../node/mention.ts'
import { EOL, Indent } from '../../node/misc.ts'
import {
    NumberLiteral,
    StringLiteral,
    TemplateStringPart,
} from '../../node/primitive-literal.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'

const escapeMap: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    '\\': '\\',
    '"': '"',
    "'": "'",
}

/**
 * 이스케이프 시퀀스를 실제 문자로 변환합니다.
 * @param str - 이스케이프 시퀀스가 포함된 문자열
 * @returns 이스케이프 시퀀스가 변환된 문자열
 */
function unescapeString(str: string): string {
    return str.replace(/\\(.)/g, (_, char) => escapeMap[char] ?? `\\${char}`)
}

export function convertTokensToNodes(tokens: Token[]): Node[] {
    return tokens.map(mapTokenToNode).filter(Boolean) as Node[]
}

function mapTokenToNode(token: Token) {
    switch (token.type) {
        case TOKEN_TYPE.SPACE:
        case TOKEN_TYPE.LINE_COMMENT:
            return null
        case TOKEN_TYPE.COMMA:
        case TOKEN_TYPE.OPENING_PARENTHESIS:
        case TOKEN_TYPE.CLOSING_PARENTHESIS:
        case TOKEN_TYPE.OPENING_BRACKET:
        case TOKEN_TYPE.CLOSING_BRACKET:
        case TOKEN_TYPE.OPENING_BRACE:
        case TOKEN_TYPE.CLOSING_BRACE:
        case TOKEN_TYPE.COLON:
        case TOKEN_TYPE.DOT:
        case TOKEN_TYPE.ASSIGNER:
        case TOKEN_TYPE.UNKNOWN:
            return new Expression(token.value, [token])
        case TOKEN_TYPE.NUMBER:
            return new NumberLiteral(parseFloat(token.value), [token])
        case TOKEN_TYPE.STRING:
            return new StringLiteral(unescapeString(token.value.slice(1, -1)), [
                token,
            ])
        case TOKEN_TYPE.TEMPLATE_STRING_START:
            // Remove leading quote, unescape content
            return new TemplateStringPart(
                unescapeString(token.value.slice(1)),
                [token],
            )
        case TOKEN_TYPE.TEMPLATE_STRING_PART:
            return new TemplateStringPart(unescapeString(token.value), [token])
        case TOKEN_TYPE.TEMPLATE_STRING_END:
            // Remove trailing quote, unescape content
            return new TemplateStringPart(
                unescapeString(token.value.slice(0, -1)),
                [token],
            )
        case TOKEN_TYPE.OPERATOR:
            return new Operator(token.value, [token])
        case TOKEN_TYPE.INDENT:
            return new Indent(token.value.length, [token])
        case TOKEN_TYPE.IDENTIFIER:
            return new Identifier(token.value, [token])
        case TOKEN_TYPE.FFI_BODY:
            return new FFIBody(token.value.slice(3, -3), [token])
        case TOKEN_TYPE.NEW_LINE:
            return new EOL([token])
        case TOKEN_TYPE.MENTION:
            return new Mention(token.value.slice(1), [token])
    }
}
