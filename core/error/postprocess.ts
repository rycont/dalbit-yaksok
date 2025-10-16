import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'
import { YaksokError } from './common.ts'
import { NotDefinedIdentifierError } from './variable.ts'

export function postprocessErrors(
    _errors: YaksokError[],
    tokens: Token[],
): YaksokError[] {
    const errors = [..._errors]

    for (let i = errors.length - 1; i >= 0; i--) {
        const current = errors[i]
        if (!(current instanceof NotDefinedIdentifierError)) continue

        const previous = errors[i - 1]
        if (!(previous instanceof NotDefinedIdentifierError)) continue

        if (!current.tokens || !previous.tokens) continue

        const currentFirstToken = current.tokens[0]
        const previousLastToken = previous.tokens[previous.tokens.length - 1]

        const currentErrorStartIndex = tokens.indexOf(currentFirstToken)
        const previousErrorEndIndex = tokens.indexOf(previousLastToken)

        const isNear =
            currentErrorStartIndex === previousErrorEndIndex + 1 ||
            (currentErrorStartIndex === previousErrorEndIndex + 2 &&
                tokens[previousErrorEndIndex + 1].type === TOKEN_TYPE.SPACE)

        if (!isNear) continue

        const currentErrorEndIndex = tokens.indexOf(
            current.tokens[current.tokens.length - 1],
        )
        const previousErrorStartIndex = tokens.indexOf(previous.tokens[0])

        const tokensInNewRange = tokens.slice(
            previousErrorStartIndex,
            currentErrorEndIndex + 1,
        )

        previous.resource = {
            name: tokensInNewRange.map((token) => token.value).join(''),
        }
        previous.tokens = tokensInNewRange

        errors.splice(i, 1)
    }

    return errors
}
