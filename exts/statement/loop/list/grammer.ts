import {
    NotProperIdentifierNameToDefineError,
    Token,
    TOKEN_TYPE,
    RDRule,
    Scope,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { ListLoop } from './node'
import { createItemIndicatorSlot } from './slot'

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
    factory(code, parse, scope) {
        const [line, lineConsumed] = code.consume()

        const test =
            patternA.func(patternA.id, line.validTokens) ||
            patternB.func(patternB.id, line.validTokens)

        if (!test || !lineConsumed.block) {
            return null
        }

        const loopTarget = parse.value(test.loopTarget)
        const loopIndex = extractName(test.name)

        const bodyScope = new Scope({
            parent: scope,
        })

        const slot = createItemIndicatorSlot(loopIndex.name)
        const slotKey = bodyScope.addSlot(slot)

        const [bodyTokens, bodyConsumed] = lineConsumed.block.consume()
        const body = parse.statement(bodyTokens, bodyScope)

        const instance = new ListLoop(
            scope,
            loopTarget,
            slotKey,
            body,
            line.validTokens,
        )

        if (loopIndex.parseError) {
            instance.injectParsingError(loopIndex.parseError)
        }

        return {
            instance,
            consumed: bodyConsumed,
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
