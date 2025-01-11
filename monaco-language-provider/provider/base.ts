import { CodeFile } from '@dalbit-yaksok/core'

import { getCommentColorParts } from '../ast-to-colorize/get-comment-color-part.ts'
import { nodeToColorTokens } from '../ast-to-colorize/index.ts'
import { ColorPart } from '../type.ts'

export class BaseProvider {
    public colorPartsByLine: Map<number, ColorPart[]>
    public lines: string[]

    constructor(private code: string) {
        this.lines = code.split('\n')
        this.colorPartsByLine = this.createColorParts(code)
    }

    createColorParts(code: string): Map<number, ColorPart[]> {
        const codeFile = new CodeFile(code)
        const { ast } = codeFile

        const nodeColorParts = nodeToColorTokens(ast).toSorted(
            (a, b) => a.position.column - b.position.column,
        )
        const commentColorParts = getCommentColorParts(codeFile.tokens)

        const colorParts = nodeColorParts.concat(commentColorParts)

        const colorPartsByLine = new Map<number, ColorPart[]>(
            new Array(this.lines.length).fill(0).map((_, index) => [index, []]),
        )
        for (const colorPart of colorParts) {
            colorPartsByLine.get(colorPart.position.line - 1)!.push(colorPart)
        }

        return colorPartsByLine
    }

    updateCode(code: string) {
        this.code = code
        this.lines = code.split('\n')

        console.time('Parse')
        this.colorPartsByLine = this.createColorParts(code)
        console.timeEnd('Parse')
    }
}
