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
    Scope,
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

export function convertTokensToNodes(scope: Scope, rawTokens: Token[]): Node[] {
    const tokens: (Token | null)[] = Array.from(rawTokens)
    const nodes: (Node | null)[] = tokens.map((t) => mapTokenToNode(scope, t))

    return nodes.filter((n) => !!n)
}

function mapTokenToNode(scope: Scope, token: Token | null) {
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
            const [slotKey, definedScope] = scope.findSlot(token.value)
            return new Identifier(definedScope, slotKey, token.value, [token])
        case TOKEN_TYPE.NEW_LINE:
            return new EOL([token])
        case TOKEN_TYPE.MENTION:
            return new Mention(token.value.slice(1), [token])
        default:
            return new Expression(token.value, [token])
    }
}
