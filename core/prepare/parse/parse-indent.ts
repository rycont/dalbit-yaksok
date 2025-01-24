import { type Node, Indent, EOL, Block } from '../../node/index.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'

export function parseIndent(_tokens: Node[], indent = 0) {
    const groups: Node[] = []
    const tokens = removeSequentialEOL([..._tokens])

    while (tokens.length) {
        const token = tokens.shift()!
        const prevToken = groups[groups.length - 1]

        if (token instanceof Indent) {
            if (!(prevToken instanceof EOL)) {
                continue
            }

            if (token.size !== indent + 1) {
                continue
            }

            const blockTokens: Node[] = []

            while (tokens.length) {
                const currentToken = tokens.shift()!

                // 다음 줄로 넘어갔는데
                if (currentToken instanceof EOL) {
                    // 첫 토큰이 들여쓰기면
                    if (tokens[0] instanceof Indent) {
                        // 들여쓰기가 같거나 더 깊으면
                        if (tokens[0].size >= token.size) {
                            blockTokens.push(currentToken)
                            continue
                        } else {
                            break
                        }
                    } else {
                        break
                    }
                } else {
                    blockTokens.push(currentToken)
                }
            }

            const child = parseIndent(blockTokens, indent + 1)
            const childTokens = getTokensFromNodes(child)

            groups.push(new Block(child, childTokens))
            groups.push(new EOL([]))
        } else {
            groups.push(token)
        }
    }

    return groups
}

function removeSequentialEOL(_tokens: Node[]) {
    const tokens = [..._tokens]
    let index = 0

    while (true) {
        if (tokens[index] instanceof EOL && tokens[index + 1] instanceof EOL) {
            tokens.splice(index, 1)
        } else {
            index++
        }

        if (index >= tokens.length) {
            break
        }
    }

    return tokens
}
