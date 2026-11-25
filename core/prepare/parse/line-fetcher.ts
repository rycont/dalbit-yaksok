import { TokenLine, TOKEN_TYPE, Token } from '@dalbit-yaksok/core'

export type LineFetcher<EnsuredFirstLine extends boolean = false> = {
    currentIndex: number
    block:
        | {
              look: TokenLine[]
              consume: () => [TokenLine[], LineFetcher]
          }
        | (EnsuredFirstLine extends true ? never : null)
} & {
    look: TokenLine | (EnsuredFirstLine extends true ? never : null)
    consume:
        | (() => [TokenLine, LineFetcher])
        | (EnsuredFirstLine extends true ? never : null)
}

export function createLineFetcher(
    lines: [TokenLine],
    currentIndex?: number,
): LineFetcher<true>
export function createLineFetcher<T extends boolean = false>(
    lines: TokenLine[],
    currentIndex?: number,
): LineFetcher<T>
export function createLineFetcher(
    lines: TokenLine[] | [TokenLine],
    currentIndex: number = 0,
): LineFetcher<boolean> {
    const lookingLine = lines[currentIndex]
    const baseLevel = lines[currentIndex - 1]?.level ?? 0

    const hasFollowingBlock = lookingLine
        ? baseLevel + 1 === lookingLine.level
        : false

    function getBlockEndIndex() {
        const firstLineAfterBlockIndex = lines
            .slice(currentIndex)
            .findIndex((l) => l.level <= baseLevel && 0 < l.validTokens.length)

        const blockEndIndex =
            firstLineAfterBlockIndex === -1
                ? lines.length - 1
                : currentIndex + firstLineAfterBlockIndex - 1

        return blockEndIndex
    }

    return {
        currentIndex,
        look: lookingLine,
        consume: lookingLine
            ? () => {
                  return [
                      lookingLine,
                      createLineFetcher(lines, currentIndex + 1),
                  ]
              }
            : null,
        get block() {
            if (!hasFollowingBlock) {
                return null
            }

            const blockEndIndex = getBlockEndIndex()
            const blockLines = lines.slice(currentIndex, blockEndIndex + 1)

            return {
                look: blockLines,
                consume() {
                    return [
                        blockLines,
                        createLineFetcher(lines, blockEndIndex + 1),
                    ] as [TokenLine[], LineFetcher]
                },
            }
        },
    }
}

export function getLineTokens(tokens: Token[]): TokenLine[] {
    const linebreaks = [-1]
        .concat(
            tokens.flatMap((t, i) =>
                t.type === TOKEN_TYPE.NEW_LINE ? [i] : [],
            ),
        )
        .concat([tokens.length])

    const lines = Array.from({ length: linebreaks.length - 1 }, (_, index) => {
        const lineTokens = tokens.slice(
            linebreaks[index] + 1,
            linebreaks[index + 1] + 1,
        )

        const validTokens = lineTokens.filter(
            (t) =>
                ![
                    TOKEN_TYPE.INDENT,
                    TOKEN_TYPE.LINE_COMMENT,
                    TOKEN_TYPE.SPACE,
                    TOKEN_TYPE.NEW_LINE,
                ].includes(t.type),
        )

        const level =
            lineTokens.length && lineTokens[0].type === TOKEN_TYPE.INDENT
                ? lineTokens[0].value.length / 4
                : 0

        return {
            level,
            validTokens,
            rawRange: [linebreaks[index] + 1, linebreaks[index + 1]] as [
                number,
                number,
            ],
        }
    })

    return lines.filter((l) => l.validTokens.length)
}
