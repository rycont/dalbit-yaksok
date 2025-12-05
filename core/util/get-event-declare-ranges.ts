import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'

export function getEventDeclareRanges(tokens: Token[]): [number, number][] {
    const eventIndexes = tokens
        .map((token, index) => {
            const isCurrentTokenEvent =
                token.type === TOKEN_TYPE.IDENTIFIER && token.value === '이벤트'

            if (!isCurrentTokenEvent) {
                return
            }

            const prevToken = tokens[index - 1]

            if (!prevToken) {
                return index
            }

            if (prevToken.type === TOKEN_TYPE.NEW_LINE) {
                return index
            }

            return
        })
        .filter((index) => index !== undefined)

    const ranges = eventIndexes.map((startIndex) => {
        const endIndexDelta = tokens
            .slice(startIndex)
            .findIndex((token) => token.type === TOKEN_TYPE.NEW_LINE)

        if (endIndexDelta === -1) {
            return [startIndex, tokens.length] as [number, number]
        }

        return [startIndex, startIndex + endIndexDelta] as [number, number]
    })

    return ranges
}
