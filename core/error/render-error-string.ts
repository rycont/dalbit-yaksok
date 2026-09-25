import { Token } from '../prepare/tokenize/token.ts'
import { Position } from '../type/position.ts'
import { bold, dim, underline } from '../util/terminal.ts'

import { type YaksokError } from './common.ts'

export interface MachineReadableError {
    message: string
    position?: `${number}:${number}`
    fileName?: string
    child?: MachineReadableError
}

export function renderErrorString(error: YaksokError): string {
    const code = error.codeFile?.text
    const fileName = error.codeFile?.fileName

    let output = ''

    output += '─────\n\n'

    output +=
        `🚨  ${bold(`문제가 발생했어요`)}${
            fileName ? dim(` (${fileName.toString()} 파일)`) : ''
        } 🚨` + '\n'

    if (error.position) {
        output +=
            `${error.position.line}번째 줄의 ${error.position.column}번째 글자\n` +
            '\n'
    }

    output += '> ' + error.message + '\n\n'

    if (code) {
        const errorTokens = error.tokens

        if (errorTokens) {
            output += '┌─────\n'
            output += getHintCodeFromErrorTokens(errorTokens, code)
            output += '└─────\n'
        } else if (error.position || error.tokens) {
            const position = error.position || error.tokens![0].position

            output += '┌─────\n'
            output += getHintCode(position, code)
            output += '└─────\n'
        }
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
        if (i < position.line - 3 || i > position.line + 2) {
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

    const startPosition = tokens[0].position
    const length = getTokensLength(tokens)

    for (let i = 0; i < lines.length; i++) {
        if (i < startPosition.line - 3 || i > startPosition.line + 2) {
            continue
        }

        const lineText = lines[i]
        const lineNum = i + 1

        if (i === startPosition.line - 1) {
            const underlineRange = [
                startPosition.column - 1,
                startPosition.column + length - 1,
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

function getTokensLength(tokens: Token[]) {
    const firstLine = tokens[0].position.line
    const firstLineBreak = tokens.findIndex(
        (token) => token.position.line !== firstLine,
    )

    if (firstLineBreak !== -1) {
        const firstLineTokens = tokens.slice(0, firstLineBreak)
        return getTokensLength(firstLineTokens)
    }

    const lastToken = tokens[tokens.length - 1]
    const startPosition = tokens[0].position

    return (
        lastToken.position.column -
        startPosition.column +
        lastToken.value.length
    )
}
