import { TokenLine, TOKEN_TYPE, Token } from '@dalbit-yaksok/core'

export type LineFetcher<EnsuredFirstLine extends boolean = false> = {
    currentIndex: number
    block:
        | {
              look: TokenLine[]
              consume: () => [TokenLine[], LineFetcher]
          }
        | (EnsuredFirstLine extends true ? never : null)
} & (EnsuredFirstLine extends true
    ? {
          look: TokenLine
          consume: () => [TokenLine, LineFetcher]
      }
    : {
          look: TokenLine | null
          consume: () => [TokenLine | null, LineFetcher]
      })

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
    function getBlockLines() {
        const entryIndentLevel = lines[0].level
        const firstLineAfterBlockIndex = lines.findIndex(
            (l) => l.level <= entryIndentLevel && 0 < l.validTokens.length,
        )

        const blockEndIndex =
            firstLineAfterBlockIndex === -1
                ? lines.length - 1
                : firstLineAfterBlockIndex - 1

        const blockLines = lines.slice(0, blockEndIndex + 1)
        return blockLines
    }

    const lookingLine = lines[currentIndex]
    const hasFollowingBlock =
        lines[currentIndex - 1].level + 1 === lines[currentIndex].level

    return {
        currentIndex: 0,
        look: lookingLine,
        consume() {
            return [lookingLine, createLineFetcher(lines, currentIndex + 1)]
        },
        get block() {
            if (!hasFollowingBlock) {
                return null
            }

            const blockLines = getBlockLines()

            return {
                look: blockLines,
                consume() {
                    return [
                        blockLines,
                        createLineFetcher(
                            lines,
                            currentIndex + blockLines.length,
                        ),
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

    return lines
}
