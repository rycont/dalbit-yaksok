import { UnexpectedCharError } from '../../error/prepare.ts'
import { Expression, Identifier, Node, Operator } from '../../node/base.ts'
import { FFIBody } from '../../node/ffi.ts'
import { Mention } from '../../node/mention.ts'
import { Indent, EOL } from '../../node/misc.ts'
import { NumberLiteral, StringLiteral } from '../../node/primitive-literal.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'

export function convertTokensToNodes(tokens: Token[]): Node[] {
    return tokens.map(mapTokenToNode).filter(Boolean) as Node[]
}

function mapTokenToNode(token: Token) {
    switch (token.type) {
        case TOKEN_TYPE.SPACE:
        case TOKEN_TYPE.LINE_COMMENT:
        case TOKEN_TYPE.UNKNOWN:
            return null
        case TOKEN_TYPE.COMMA:
        case TOKEN_TYPE.OPENING_PARENTHESIS:
        case TOKEN_TYPE.CLOSING_PARENTHESIS:
        case TOKEN_TYPE.OPENING_BRACKET:
        case TOKEN_TYPE.CLOSING_BRACKET:
        case TOKEN_TYPE.COLON:
            return new Expression(token.value, [token])
        case TOKEN_TYPE.NUMBER:
            return new NumberLiteral(parseFloat(token.value), [token])
        case TOKEN_TYPE.STRING:
            return new StringLiteral(token.value.slice(1, -1), [token])
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
