import {
    NotProperIdentifierNameToDefineError,
    Token,
    TOKEN_TYPE,
    RDRule,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { ListLoop } from './node'

const patternA = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.enum(['반복', '반복하기']),
        }),
        j.type<Token>().space().select('loopTarget'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('의'),
        }),
        j.type<Token>().space().select('name'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('마다'),
        }),
    ])
    .compile()

const patternB = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('loopTarget'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('의'),
        }),
        j.type<Token>().space().select('name'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('마다'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.enum(['반복', '반복하기']),
        }),
    ])
    .compile()

const grammer: RDRule = {
    name: '리스트 순회',
    factory(line, action) {
        const test =
            patternA.func(patternA.id, line.validTokens) ||
            patternB.func(patternB.id, line.validTokens)

        if (!test) {
            return null
        }

        const loopTarget = action.parse(test.loopTarget)
        const loopIndex = extractName(test.name)

        const body = action.parseFollowingBlock().consume()
        const instance = new ListLoop(
            loopTarget,
            loopIndex.name,
            body,
            line.validTokens,
        )

        if (loopIndex.parseError) {
            instance.injectParsingError(loopIndex.parseError)
        }

        return {
            instance,
        }
    },
}

function extractName(nameTokens: Token[]) {
    if (
        nameTokens.length === 1 &&
        nameTokens[0].type === TOKEN_TYPE.IDENTIFIER
    ) {
        const name = nameTokens[0].value
        return { name }
    }

    const name = nameTokens
        .filter((t) => t.type === TOKEN_TYPE.IDENTIFIER)
        .map((t) => t.value)
        .join('')

    return {
        name,
        parseError: new NotProperIdentifierNameToDefineError({
            tokens: nameTokens,
        }),
    }
}

export default grammer
