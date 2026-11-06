import { TOKEN_TYPE } from '@dalbit-yaksok/core'
import type { Extension, Token } from '@dalbit-yaksok/core'

import { j } from '@dalbit-yaksok/pattern'
import { extractSignature } from './extract-signature'
import { FunctionDeclareHeader } from './node/header'
import { createCallingRules } from './calling-rule/create'
import { DeclareEvent, DeclareFFI, DeclareFunction } from './node/declare'
import { createEventSubscriptionRules } from './calling-rule/event'

export * from './error/no-static'
export * from './error/no-body'
export * from './error/missing-required'
export * from './error/no-signature'
export * from './error/required-parameter'
export * from './error/too-many-arguments'
export * from './node/invoke'
export * from './node/event'
export * from './node/declare'

const 약속Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('약속').select('type'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.type<Token>().space().select('signature'),
    ])
    .compile()

const 번역Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번역').select('type'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            value: j.select('runtime').select('runtime'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.type<Token>().space().select('signature'),
    ])
    .compile()

const 이벤트Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('이벤트').select('type'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.select('id'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.type<Token>().space().select('signature'),
    ])
    .compile()

const functionStatement: Extension = {
    capabilties: {
        Grammer: [
            {
                name: '약속(함수) 만들기',
                description: '설명이 여기 들어감',
                factory(line, actions) {
                    const testResult =
                        약속Pattern.func(약속Pattern.id, line.validTokens) ||
                        번역Pattern.func(번역Pattern.id, line.validTokens) ||
                        이벤트Pattern.func(이벤트Pattern.id, line.validTokens)

                    if (!testResult) {
                        return null
                    }

                    const signature = extractSignature(testResult.signature)

                    const header = new FunctionDeclareHeader(
                        signature,
                        undefined,
                        line.validTokens,
                    )

                    const callingRules = createCallingRules(signature, header)

                    if (testResult.type === '약속') {
                        const body = actions
                            .parseFollowingBlock(callingRules)
                            .consume()

                        return {
                            instance: new DeclareFunction(
                                body,
                                header,
                                callingRules,
                                line.rawTokens.concat(body.tokens),
                            ),
                            rules: callingRules,
                        }
                    } else if (testResult.type === '번역') {
                        const nextLine = actions.nextLine(1).consume()
                        const bodyToken = nextLine.validTokens[0]

                        if (bodyToken.type !== TOKEN_TYPE.FFI_BODY) {
                            // TODO: FFI_BODY를 기다리는 오류
                        }

                        const bodyText = bodyToken.value.slice(
                            bodyToken.value.startsWith('***') ? 3 : 0,
                            bodyToken.value.endsWith('***') ? -3 : 0,
                        )

                        return {
                            instance: new DeclareFFI(
                                callingRules,
                                header,
                                testResult.runtime,
                                bodyText,
                                line.rawTokens.concat(nextLine.rawTokens),
                            ),
                            rules: callingRules,
                        }
                    } else if (testResult.type === '이벤트') {
                        return {
                            instance: new DeclareEvent(
                                header,
                                testResult.id,
                                line.validTokens,
                            ),
                            rules: [
                                createEventSubscriptionRules(
                                    signature,
                                    testResult.id,
                                ),
                            ],
                        }
                    }

                    return null
                },
            },
        ],
    },
}

export default functionStatement
