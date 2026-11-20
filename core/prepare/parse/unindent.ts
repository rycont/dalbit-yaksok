import { TOKEN_TYPE, type Token } from '@dalbit-yaksok/core'

export function unindent(tokens: Token[]) {
    if (tokens.length === 0) {
        return []
    }

    if (tokens[0].type !== TOKEN_TYPE.INDENT) {
        return tokens
    }

    const indentWidth = tokens[0].value.length

    const unindented = tokens
        .slice(1)
        .map((t): Token =>
            t.type === TOKEN_TYPE.INDENT
                ? {
                      type: TOKEN_TYPE.INDENT,
                      value: t.value.slice(indentWidth),
                      position: t.position,
                  }
                : t,
        )
        .filter((t) => t.type !== TOKEN_TYPE.INDENT || 0 < t.value.length)

    return unindented
}
