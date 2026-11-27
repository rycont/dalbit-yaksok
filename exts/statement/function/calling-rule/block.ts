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
    Evaluable,
    RuleList,
    Expression,
    SRRule,
    r,
    StatementCaller,
    RDFactory,
    UnexpectedArgumentError,
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
    slotKey: SlotKey,
): RuleList {
    const staticParts = signature.headerParts.slice(
        0,
        -1,
    ) as FunctionStaticPart[]

    const rdPattern = j
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

    const factory: RDFactory = (code, action) => {
        const [line, headerConsumed] = code.consume()
        const test = rdPattern.func(rdPattern.id, line.validTokens)

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
            slotKey,
            invokingArguments,
            line.validTokens,
        )

        return {
            instance: new Evaluator(scope, nodeInstance, line.validTokens),
            consumed: bodyConsumed,
        }
    }

    const rdRule: RDRule = {
        name: signature.functionName,
        factory,
    }

    const srPattern = staticParts.map((p) =>
        j.instance(Expression).field({
            value: j.enum(p.names.map((n) => n.value)),
        }),
    )

    const srRule: SRRule = r({
        pattern: srPattern,
        isStatement: true,
        factory(_, tokens, scope) {
            console.log(_)
            return new StatementCaller(scope, factory, tokens)
        },
    })

    return {
        rd: [rdRule],
        sr: [srRule],
    }
}

function parseBlockParameterTokens(
    tokenLines: TokenLine[],
    parse: FactoryParsers,
    parameterSlots: Map<ParameterElement, SlotKey>,
): { parsingErrors: YaksokError[]; parameters: Map<SlotKey, Evaluable> } {
    const parsedLines = tokenLines.map(parseTokenLine)

    const parameterErrors: YaksokError[] = parsedLines
        .map((l) => l.parseError)
        .filter((e) => !!e)

    const nameToSlotKey = Object.fromEntries(
        parameterSlots.entries().map(([k, v]) => [k.name, v]),
    )

    const keyGroup = Object.groupBy(parsedLines, (l) => {
        if (l.name && l.name in nameToSlotKey) {
            return 'known'
        }

        return 'unknown'
    })

    const unknownKeysError = keyGroup.unknown
        ? [
              new UnexpectedArgumentError({
                  tokens: keyGroup.unknown[0].nameTokens,
                  resource: {
                      names: keyGroup.unknown.map((k) => k.name!),
                  },
              }),
          ]
        : []

    return {
        parsingErrors: parameterErrors.concat(unknownKeysError),
        parameters: new Map(
            keyGroup.known?.map((l) => [
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
        nameTokens: test.name,
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
