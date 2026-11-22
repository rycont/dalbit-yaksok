import {
    TOKEN_TYPE,
    RDRule,
    Token,
    NotProperIdentifierNameToDefineError,
    UnexpectedTokenError,
    YaksokError,
    Evaluator,
    TokenLine,
    FactoryParsers,
    SlotKey,
    Scope,
    ValueType,
    Evaluable,
} from '@dalbit-yaksok/core'
import {
    FunctionSignature,
    FunctionStaticPart,
    ParameterElement,
} from '../type.ts'
import { j } from '@dalbit-yaksok/pattern'

import { FunctionInvoke } from '../mod.ts'
import { InvokingArguments } from '../node/arguments.ts'

export function createBlockRule(
    scope: Scope,
    signature: FunctionSignature,
    parameterSlots: Map<ParameterElement, SlotKey>,
    slot: FunctionSlot,
): RDRule {
    const staticParts = signature.headerParts.slice(
        0,
        -1,
    ) as FunctionStaticPart[]

    const pattern = j
        .list(
            staticParts.map((p) =>
                j.field({
                    type: j.literal(TOKEN_TYPE.IDENTIFIER),
                    value:
                        p.names.length === 1
                            ? j.literal(p.names[0].value)
                            : j.enum(p.names.map((t) => t.value)),
                }),
            ),
        )
        .compile()

    return {
        name: signature.functionName,
        factory(code, action) {
            console.log('엄')
            const [line, headerConsumed] = code.consume()
            const test = pattern.func(pattern.id, line.validTokens)

            if (!test || !headerConsumed.block) {
                return null
            }

            const [bodyTokens, bodyConsumed] = headerConsumed.block.consume()

            const parameterExtraction = parseBlockParameterTokens(
                bodyTokens,
                action,
                parameterSlots,
            )

            const invokingArguments = new InvokingArguments(
                scope,
                signature.parameterScheme,
                parameterSlots,
                parameterExtraction.parameters,
                line.validTokens,
                parameterExtraction.parsingErrors,
            )

            const nodeInstance = new FunctionInvoke(
                scope,
                slot,
                invokingArguments,
                line.validTokens,
            )

            return {
                instance: new Evaluator(scope, nodeInstance, line.validTokens),
                consumed: bodyConsumed,
            }
        },
    }
}

function parseBlockParameterTokens(
    tokenLines: TokenLine[],
    parse: FactoryParsers,
    parameterSlots: Map<ParameterElement, SlotKey>,
): { parsingErrors: YaksokError[]; parameters: Map<SlotKey, Evaluable> } {
    const parsedLines = tokenLines.map(parseTokenLine)

    const parsingErrors: YaksokError[] = parsedLines
        .map((l) => l.parseError)
        .filter((e) => !!e)

    const nameToSlotKey = Object.fromEntries(
        parameterSlots.entries().map(([k, v]) => [k.name, v]),
    )

    return {
        parsingErrors,
        parameters: new Map(
            parsedLines
                .filter((l) => l.name)
                .map((l) => [
                    nameToSlotKey[l.name!],
                    parse.value(l.valueTokens!),
                ]),
        ),
    }
}

const tokenLinePattern = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('name'),
        j.field({
            type: j.literal(TOKEN_TYPE.COLON),
        }),
        j.type<Token>().space().select('value'),
    ])
    .compile()

function parseTokenLine(tokenLine: TokenLine) {
    const test = tokenLinePattern.func(
        tokenLinePattern.id,
        tokenLine.validTokens,
    )

    if (!test) {
        return {
            parseError: new UnexpectedTokenError({
                resource: {
                    parts: '약속 부르기',
                },
                tokens: tokenLine.validTokens,
            }),
        }
    }

    const nameExtraction = extractName(test.name)

    return {
        name: nameExtraction.name,
        valueTokens: test.value,
        parseError: nameExtraction.parseError,
    }
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
