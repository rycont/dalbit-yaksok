import { Token } from '../prepare/tokenize/token.ts'
import { Position } from '../type/position.ts'

import { type YaksokError, bold, dim, underline } from './common.ts'

export function renderErrorString(error: YaksokError) {
    const code = error.codeFile?.text
    const fileName = error.codeFile?.fileName

    let output = ''

    output += '─────\n\n'

    output +=
        `🚨  ${bold(`문제가 발생했어요`)}${
            fileName ? dim(` (${fileName} 파일)`) : ''
        } 🚨` + '\n'

    if (error.position)
        output +=
            `${error.position.line}번째 줄의 ${error.position.column}번째 글자\n` +
            '\n'

    output += '> ' + error.message + '\n\n'

    if (code && error.tokens) {
        output += '┌─────\n'
        output += getHintCodeFromErrorTokens(error.tokens, code)
        output += '└─────\n'
    } else if (code && error.position) {
        output += '┌─────\n'
        output += getHintCode(error.position, code)
        output += '└─────\n'
    }

    if (error.child) {
        output += '\n'
        output = renderErrorString(error.child) + '\n' + output
    }

    return output
}

function getHintCode(position: Position, code: string) {
    let output = ''
    const lines = code.split('\n')

    for (let i = 0; i < lines.length; i++) {
        if (i < position.line - 2 || i > position.line + 1) {
            continue
        }

        const lineText = lines[i]
        const lineNum = i + 1

        if (i === position.line - 1) {
            output += '│  ' + lineNum + '  ' + lineText + '\n'
            output += '│       ' + ' '.repeat(position.column) + '^' + '\n'
            continue
        }

        output += '│  \x1b[2m' + lineNum + '  ' + lineText + '\x1b[0m' + '\n'
    }

    return output
}

function getHintCodeFromErrorTokens(tokens: Token[], code: string) {
    let output = ''
    const lines = code.split('\n')

    const position = tokens[0].position
    const length =
        tokens[tokens.length - 1].position.column - position.column + 1

    for (let i = 0; i < lines.length; i++) {
        if (i < position.line - 2 || i > position.line + 1) {
            continue
        }

        const lineText = lines[i]
        const lineNum = i + 1

        if (i === position.line - 1) {
            const underlineRange = [
                position.column - 1,
                position.column + length,
            ]

            output += '│  ' + lineNum + '  '
            output += lineText.slice(0, underlineRange[0])
            output += bold(
                underline(lineText.slice(underlineRange[0], underlineRange[1])),
            )
            output += lineText.slice(underlineRange[1]) + '\n'
        } else {
            output +=
                '│  \x1b[2m' + lineNum + '  ' + lineText + '\x1b[0m' + '\n'
        }
    }

    return output
}
