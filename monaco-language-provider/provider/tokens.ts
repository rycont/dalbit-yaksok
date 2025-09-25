import type { languages } from 'monaco-editor'
import { BaseProvider } from './base.ts'

export class TokensProvider implements languages.TokensProvider {
    constructor(private base: BaseProvider) {}

    getInitialState(): languages.IState {
        return {
            clone() {
                return this
            },
            equals() {
                return false
            },
        }
    }

    tokenize(
        line: string,
        state: languages.IState,
    ): languages.ILineTokens {
        const lineNumber = this.base.lines.indexOf(line)

        const colorParts = this.base.colorPartsByLine.get(lineNumber)

        if (!colorParts) {
            return {
                tokens: [],
                endState: state,
            }
        }

        const colorTokens = colorParts.map((part) => ({
            scopes: part.scopes,
            startIndex: part.position.column - 1,
        }))

        return {
            tokens: colorTokens,
            endState: state,
        }
    }
}
