import {
    Evaluable,
    Extension,
    FactoryParsers,
    Identifier,
    IndexFetch,
    NotProperIdentifierNameToDefineError,
    RESERVED_WORDS,
    Statement,
    Token,
    TOKEN_TYPE,
    YaksokError,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { SetVariable } from './node'
import { SetToIndex } from './set-index-node'
import { createVariableSlot } from './slot'

const pattern = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('name'),
        j.field({
            type: j.literal(TOKEN_TYPE.ASSIGNER),
            value: j.select('operator'),
        }),
        j.type<Token>().space().select('value'),
    ])
    .compile()

const indexSetterPattern = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('target'),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_BRACKET),
        }),
        j.type<Token>().space().select('index'),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_BRACKET),
        }),
    ])
    .compile()

const extension: Extension = {
    capabilties: {
        Grammer: [
            {
                name: '변수 정하기',
                factory(code, parse, scope) {
                    const [line, consumed] = code.consume()

                    const testResult = pattern.func(
                        pattern.id,
                        line.validTokens,
                    )

                    if (!testResult) {
                        return null
                    }

                    const nameExtraction = extractName(testResult.name, parse)
                    const evaluator = parse.value(testResult.value)

                    if (nameExtraction.type === 'identifier') {
                        if (RESERVED_WORDS.has(nameExtraction.name)) {
                            const parsingErrors = [
                                new NotProperIdentifierNameToDefineError({
                                    tokens: testResult.name,
                                    resource: {
                                        context: '변수',
                                    },
                                }),
                            ]

                            const instance: Statement = {
                                scope,
                                parsingErrors,
                                tokens: testResult.name,
                                execute() {
                                    throw parsingErrors[0]
                                },
                                validate() {
                                    return parsingErrors
                                },
                            }

                            return {
                                instance,
                                consumed,
                            }
                        }

                        let [slotKey, foundScope] = scope.findSlot(
                            nameExtraction.name,
                        )

                        if (!slotKey) {
                            const newSlot = createVariableSlot(
                                nameExtraction.name,
                            )

                            slotKey = scope.addSlot(newSlot)
                        }

                        const declaredScope = foundScope ?? scope

                        const target = new Identifier(
                            declaredScope,
                            slotKey,
                            nameExtraction.name,
                            testResult.name,
                        )

                        const node = new SetVariable(
                            scope,
                            target,
                            evaluator,
                            line.validTokens,
                            testResult.operator,
                        )

                        if (0 < nameExtraction.parseErrors.length) {
                            for (const e of nameExtraction.parseErrors) {
                                node.injectParsingError(e)
                            }
                        }

                        return {
                            instance: node,
                            consumed,
                        }
                    }

                    return {
                        instance: new SetToIndex(
                            scope,
                            new IndexFetch(
                                nameExtraction.target,
                                nameExtraction.index,
                                testResult.name,
                            ),
                            evaluator,
                            testResult.operator,
                            line.validTokens,
                        ),
                        consumed,
                    }
                },
            },
        ],
    },
}

function extractName(
    nameTokens: Token[],
    parse: FactoryParsers,
): (
    | {
          type: 'identifier'
          name: string
      }
    | {
          type: 'index-setter'
          target: Evaluable
          index: Evaluable
      }
) & {
    parseErrors: YaksokError[]
} {
    if (
        nameTokens.length === 1 &&
        nameTokens[0].type === TOKEN_TYPE.IDENTIFIER
    ) {
        const name = nameTokens[0].value
        return { type: 'identifier', parseErrors: [], name }
    }

    const indexSetterPatternResult = indexSetterPattern.func(
        indexSetterPattern.id,
        nameTokens,
    )

    if (indexSetterPatternResult) {
        return {
            type: 'index-setter',
            target: parse.value(indexSetterPatternResult.target),
            index: parse.value(indexSetterPatternResult.index),
            parseErrors: [],
        }
    }

    return {
        type: 'identifier',
        parseErrors: [
            new NotProperIdentifierNameToDefineError({
                tokens: nameTokens,
            }),
        ],
        name: nameTokens.map((t) => t.value).join(''),
    }
}

export default extension
