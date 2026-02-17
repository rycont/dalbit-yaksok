import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { DeclareEvent } from '../../../../../node/event.ts'
import { Token, TOKEN_TYPE } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { functionHeaderToPattern } from './common.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '메소드',
    },
    {
        type: Evaluable,
    },
    {
        type: Expression,
        value: ',',
    },
    {
        type: Identifier,
        value: '이벤트',
    },
    {
        type: Expression,
        value: '(',
    },
    {
        type: Identifier,
    },
    {
        type: Expression,
        value: ')',
    },
    {
        type: Expression,
        value: ',',
    },
]

export function tokensToMethodEventDeclareRule(
    prefixTokens: Token[],
    headerTokens: Token[],
): Rule[] {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const rawPrefixPattern = tokensToPattern(prefixTokens)
    const reducedPrefixPattern = PREFIX

    return [rawPrefixPattern, reducedPrefixPattern].map((prefixPattern) => ({
        pattern: [...prefixPattern, ...headerPattern],
        factory: (nodes, matchedTokens) => {
            const eventIndex = nodes.findIndex(
                (node) => node instanceof Identifier && node.value === '이벤트',
            )
            const eventIdNode = nodes[eventIndex + 2]

            // eventIdNode가 Identifier인지 확인 (괄호 다음)
            // PREFIX 패턴상: 이벤트(index), '(', ID(index+2), ')'

            // 하지만 nodes에는 토큰이 아니라 Node나 Token 값(Identifier value 등)이 들어올 수 있음.
            // PatternUnit의 type에 따라 다름.
            // Identifier 타입은 string 값이 아니라 Identifier 노드임? Identifier 클래스 타입임.

            // dynamicRule 시스템에서 factory의 nodes 인자는 pattern에 매칭된 결과물들임.
            // Identifier 타입 -> Identifier 노드
            // Expression 타입 -> string 값 (보통) 또는 Expression 노드?
            // tokensToPattern 함수를 보면 Expression 타입은 value를 지정함. 이 경우 string이 올 수 있음.

            // 안전하게 matchedTokens에서 찾는게 나을 수도 있음.
            // matchedTokens는 전체 토큰.

            // prefixTokens를 분석해서 eventId를 찾는 것이 가장 안전함.
            const eventId = findEventIdFromPrefixTokens(prefixTokens)

            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            return new DeclareEvent(
                {
                    name,
                    eventId,
                },
                matchedTokens,
            )
        },
    }))
}

function findEventIdFromPrefixTokens(tokens: Token[]): string {
    for (let i = 0; i < tokens.length; i++) {
        if (
            tokens[i].type === TOKEN_TYPE.IDENTIFIER &&
            tokens[i].value === '이벤트'
        ) {
            // 이벤트, (, ID
            let cursor = i + 1
            while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
            if (tokens[cursor]?.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
                cursor++
                while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
                if (tokens[cursor]?.type === TOKEN_TYPE.IDENTIFIER) {
                    return tokens[cursor].value
                }
            }
        }
    }
    return ''
}

function tokensToPattern(tokens: Token[]): PatternUnit[] {
    const units: PatternUnit[] = []
    for (const token of tokens) {
        if (token.type === TOKEN_TYPE.SPACE) {
            continue
        }
        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            units.push({
                type: Identifier,
                value: token.value,
            })
            continue
        }
        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            units.push({
                type: Expression,
                value: '(',
            })
            continue
        }
        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            units.push({
                type: Expression,
                value: ')',
            })
            continue
        }
        if (token.type === TOKEN_TYPE.COMMA) {
            units.push({
                type: Expression,
                value: ',',
            })
        }
    }
    return units
}
