import {
    NumberLiteral,
    Expression,
    Identifier,
    Node,
    Operator,
    EOL,
    TOKEN_TYPE,
    StringStaticPart,
    Mention,
    type Token,
} from '@dalbit-yaksok/core'

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

export function convertTokensToNodes(rawTokens: Token[]): Node[] {
    const tokens: (Token | null)[] = Array.from(rawTokens)
    const nodes: (Node | null)[] = tokens.map(mapTokenToNode)

    return nodes.filter((n) => !!n)
}

function mapTokenToNode(token: Token | null) {
    if (token === null) {
        return null
    }

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
        case TOKEN_TYPE.IDENTIFIER:
            return new Identifier(token.value, [token])
        case TOKEN_TYPE.NEW_LINE:
            return new EOL([token])
        case TOKEN_TYPE.MENTION:
            return new Mention(token.value.slice(1), [token])
        default:
            return new Expression(token.value, [token])
    }
}
