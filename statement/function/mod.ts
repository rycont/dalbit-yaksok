import { Scope, TOKEN_TYPE, UnexpectedTokenError } from '@dalbit-yaksok/core'
import type { Extension, Token, RDRule } from '@dalbit-yaksok/core'

import { j } from '@dalbit-yaksok/pattern'
import { extractSignature } from './extract-signature.ts'
import { FunctionDeclareHeader } from './node/header.ts'
import { createCallingRules } from './calling-rule/create.ts'
import { DeclareEvent, DeclareFFI, DeclareFunction } from './node/declare.ts'
import { createEventSubscriptionRules } from './calling-rule/event.ts'
import { ReturnStatement } from './node/return.ts'
import { MissingFunctionBody } from './error/no-body.ts'
import { createFunctionSlot, createParameterSlot } from './slot.ts'

export * from './error/no-static.ts'
export * from './error/no-body.ts'
export * from './error/missing-required.ts'
export * from './error/return-out-of-function.ts'
export * from './error/no-signature.ts'
export * from './error/required-parameter.ts'
export * from './error/too-many-arguments.ts'
export * from './node/invoke.ts'
export * from './node/event.ts'
export * from './node/declare.ts'

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

const functionGrammer: RDRule = {
    name: '약속(함수) 만들기',
    description: '설명이 여기 들어감',
    factory(code, parse, scope) {
        const [line, headerConsumed] = code.consume()

        const testResult =
            번역Pattern.func(번역Pattern.id, line.validTokens) ||
            약속Pattern.func(약속Pattern.id, line.validTokens) ||
            이벤트Pattern.func(이벤트Pattern.id, line.validTokens)

        if (!testResult) {
            return null
        }

        const signatureResult = extractSignature(testResult.signature)

        const header = new FunctionDeclareHeader(
            signatureResult.signature,
            line.validTokens,
            scope,
        )

        if (signatureResult.notParsableTokens.length) {
            header.injectError(
                new UnexpectedTokenError({
                    resource: {
                        parts: '약속 만들기',
                    },
                    tokens: signatureResult.notParsableTokens,
                }),
            )
        }

        // const callingRules = createCallingRules(
        //     signatureResult.signature,
        //     header,
        // )

        if (testResult.type === '약속') {
            if (!headerConsumed.block) {
                return null
            }

            const [bodyTokens, bodyConsumed] = headerConsumed.block.consume()

            const runnableSlot = createFunctionSlot(
                header.signature.functionName,
            )

            const slotKey = scope.addSlot(runnableSlot)

            const subscope = new Scope({
                parent: scope,
            })

            const parameterSlots = new Map(
                header.signature.parameterScheme.map((p) => [
                    p,
                    subscope.addSlot(createParameterSlot(p.name)),
                ]),
            )

            const callingRules = createCallingRules(
                signatureResult.signature,
                scope,
                slotKey,
                parameterSlots,
            )

            scope.addRuleList(callingRules)

            const body = parse.statement(bodyTokens, subscope)

            const instance =
                body.statements.length === 0
                    ? header
                    : new DeclareFunction(
                          scope,
                          slotKey,
                          body,
                          line.validTokens.concat(body.tokens),
                      )

            instance.parsingErrors = body.validate().concat(header.validate())

            return {
                instance,
                consumed: bodyConsumed,
            }
        } else if (testResult.type === '번역') {
            const [ffiBody, ffiConsumed] = headerConsumed.consume?.() || [
                undefined,
                headerConsumed,
            ]

            const bodyToken = ffiBody?.validTokens[0]

            const bodyText = bodyToken
                ? bodyToken.value.slice(
                      bodyToken.value.startsWith('***') ? 3 : 0,
                      bodyToken.value.endsWith('***') ? -3 : 0,
                  )
                : ''

            const instance = new DeclareFFI(
                scope,
                callingRules,
                header,
                testResult.runtime,
                bodyText,
                line.validTokens.concat(ffiBody?.validTokens ?? []),
            )

            if (bodyToken?.type !== TOKEN_TYPE.FFI_BODY) {
                instance.injectParsingError(
                    new MissingFunctionBody({
                        statement: instance,
                    }),
                )
            }

            scope.addRuleList(callingRules)

            return {
                instance,
                consumed: ffiConsumed,
            }
        } else if (testResult.type === '이벤트') {
            const eventSubscriptionRule = createEventSubscriptionRules(
                signatureResult.signature,
                header,
            )

            scope.addRuleList(eventSubscriptionRule)

            return {
                instance: new DeclareEvent(
                    scope,
                    eventSubscriptionRule,
                    header,
                    testResult.id,
                    line.validTokens,
                ),
                consumed: headerConsumed,
            }
        }

        return null
    },
}

const returnPattern = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('returnValueTokens'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('반환하기'),
        }),
    ])
    .compile()

const altReturnPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('약속'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('그만'),
        }),
    ])
    .compile()

const returnGrammer: RDRule = {
    name: '반환하기',
    description: '설명?',
    factory(code, parse) {
        const [line, consumed] = code.consume()

        const testResult = returnPattern.func(
            returnPattern.id,
            line.validTokens,
        )

        if (testResult) {
            const node = parse.value(testResult.returnValueTokens)

            return {
                instance: new ReturnStatement(line.validTokens, node),
                consumed,
            }
        }

        const altTestResult = altReturnPattern.func(
            altReturnPattern.id,
            line.validTokens,
        )

        if (altTestResult) {
            return {
                instance: new ReturnStatement(line.validTokens),
                consumed,
            }
        }

        return null
    },
}

const functionStatement: Extension = {
    capabilties: {
        Grammer: [functionGrammer, returnGrammer],
    },
}

export default functionStatement
