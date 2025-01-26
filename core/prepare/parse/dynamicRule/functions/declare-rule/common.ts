import { Identifier } from '../../../../../mod.ts'
import { Expression } from '../../../../../node/base.ts'
import { Token, TOKEN_TYPE } from '../../../../tokenize/token.ts'
import { PatternUnit } from '../../../type.ts'

export function functionHeaderToPattern(tokens: Token[]): PatternUnit[] {
    const units = tokens.map(mapTokenToPatternUnit).filter(Boolean)
    return units as NonNullable<(typeof units)[number]>[]
}

function mapTokenToPatternUnit(token: Token): PatternUnit | null {
    if (token.type === TOKEN_TYPE.IDENTIFIER) {
        return {
            type: Identifier,
            value: token.value,
        }
    }

    if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
        return {
            type: Expression,
            value: '(',
        }
    }

    if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
        return {
            type: Expression,
            value: ')',
        }
    }

    return null
}
