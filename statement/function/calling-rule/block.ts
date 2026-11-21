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
} from '@dalbit-yaksok/core'
import { FunctionSignature, FunctionStaticPart } from '../type.ts'
import { j } from '@dalbit-yaksok/pattern'
import { FunctionDeclareHeader } from '../node/header.ts'
import { FunctionInvoke } from '../mod.ts'
import { InvokingArguments } from '../node/arguments.ts'

export function createBlockRule(
    signature: FunctionSignature,
    header: FunctionDeclareHeader,
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
                    value: p.names.length
                        ? j.enum(p.names.map((t) => t.value))
                        : j.literal(p.names[0].value),
                }),
            ),
        )
        .compile()

    return {
        name: '함수',
        factory(code, action) {
            const [line, headerConsumed] = code.consume()
            const test = pattern.func(pattern.id, line.validTokens)

            if (!test || !headerConsumed.block) {
                return null
            }

            const [bodyTokens, bodyConsumed] = headerConsumed.block.consume()

            const parameterExtraction = parseBlockParameterTokens(
                bodyTokens,
                action,
            )

            const invokingArguments = new InvokingArguments(
                parameterExtraction.parameters,
                header.signature.parameterScheme,
                line.validTokens,
                parameterExtraction.parsingErrors,
            )

            const nodeInstance = new FunctionInvoke(
                header,
                invokingArguments,
                line.validTokens,
            )

            return {
                instance: new Evaluator(nodeInstance, line.validTokens),
                consumed: bodyConsumed,
            }
        },
    }
}

function parseBlockParameterTokens(
    tokenLines: TokenLine[],
    parse: FactoryParsers,
) {
    const parsedLines = tokenLines.map(parseTokenLine)

    const parsingErrors: YaksokError[] = parsedLines
        .map((l) => l.parseError)
        .filter((e) => !!e)

    return {
        parsingErrors,
        parameters: new Map(
            parsedLines
                .filter((l) => l.name)
                .map((l) => [l.name!, parse.value(l.valueTokens!)]),
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
