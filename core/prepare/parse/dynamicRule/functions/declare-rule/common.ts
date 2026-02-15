import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { type Token, TOKEN_TYPE } from '../../../../tokenize/token.ts'
import type { PatternUnit } from '../../../type.ts'

export function functionHeaderToPattern(tokens: Token[]): PatternUnit[] {
    const units: (PatternUnit | null)[] = []
    let i = 0

    while (i < tokens.length) {
        const token = tokens[i]

        if (
            token.type === TOKEN_TYPE.OPENING_PARENTHESIS &&
            tokens[i + 1]?.type === TOKEN_TYPE.IDENTIFIER &&
            tokens[i + 2]?.type === TOKEN_TYPE.COMMA
        ) {
            units.push({ type: Evaluable })
            i = skipDestructureGroup(tokens, i)
            continue
        }

        const unit = mapTokenToPatternUnit(token)
        if (unit) {
            units.push(unit)
        }
        i++
    }

    return units as PatternUnit[]
}

function skipDestructureGroup(tokens: Token[], startIndex: number): number {
    let i = startIndex + 1
    while (
        i < tokens.length &&
        tokens[i].type !== TOKEN_TYPE.CLOSING_PARENTHESIS
    ) {
        i++
    }
    return i + 1
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
