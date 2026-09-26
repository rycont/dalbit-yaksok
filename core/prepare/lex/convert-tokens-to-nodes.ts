import { DirectReplacer, NumberLiteral } from '@dalbit-yaksok/core'
import { Expression, Identifier, Node, Operator } from '../../node/base.ts'
import { FFIBody } from '../../node/ffi.ts'
import { Mention } from '../../node/mention.ts'
import { EOL, Indent } from '../../node/misc.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'
import { StringStaticPart } from '../../node/primitive-literals/string.ts'

const escapeMap: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    '\\': '\\',
    '"': '"',
    "'": "'",
}

function unescapeString(str: string): string {
    return str.replace(/\\(.)/g, (_, char) => escapeMap[char] ?? `\\${char}`)
}

export function convertTokensToNodes(
    tokens: Token[],
    directReplacers: DirectReplacer[],
): Node[] {
    const nodes: (Node | null)[] = tokens.map(mapTokenToNode)

    for (const replacer of directReplacers) {
        nodes.fill(null, replacer.tokenRange[0], replacer.tokenRange[1])
        nodes.splice(
            replacer.tokenRange[0],
            replacer.nodes.length,
            ...replacer.nodes,
        )
    }

    return nodes.filter((n) => !!n)
}

function mapTokenToNode(token: Token) {
    switch (token.type) {
        case TOKEN_TYPE.SPACE:
        case TOKEN_TYPE.LINE_COMMENT:
            return null
        case TOKEN_TYPE.NUMBER:
            return new NumberLiteral(parseFloat(token.value), [token])
        case TOKEN_TYPE.STATIC_STRING:
            return new StringStaticPart(unescapeString(token.value), [token])
        case TOKEN_TYPE.OPERATOR:
            return new Operator(token.value, [token])
        case TOKEN_TYPE.INDENT:
            return new Indent(token)
        case TOKEN_TYPE.IDENTIFIER:
            return new Identifier(token.value, [token])
        case TOKEN_TYPE.FFI_BODY:
            return new FFIBody(token.value.slice(3, -3), [token])
        case TOKEN_TYPE.NEW_LINE:
            return new EOL([token])
        case TOKEN_TYPE.MENTION:
            return new Mention(token.value.slice(1), [token])
        default:
            return new Expression(token.value, [token])
    }
}
