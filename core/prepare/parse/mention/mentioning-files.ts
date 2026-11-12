import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'

export function getMentioningFiles(tokens: Token[]) {
    const mentioningNames = tokens
        .filter(isMention)
        .map((token) => token.value.slice(1))

    const uniqueMentions = new Set<string>(mentioningNames)
    return [...uniqueMentions]
}

function isMention(token: Token) {
    return token.type === TOKEN_TYPE.MENTION
}
