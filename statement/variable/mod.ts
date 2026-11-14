import {
    Evaluable,
    Extension,
    IndexFetch,
    NotProperIdentifierNameToDefineError,
    Token,
    TOKEN_TYPE,
    YaksokError,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { SetVariable } from './node'
import { SetToIndex } from './set-index-node'

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
                factory(line, actions) {
                    const testResult = pattern.func(
                        pattern.id,
                        line.validTokens,
                    )

                    if (!testResult) {
                        return null
                    }

                    const nameExtraction = extractName(
                        testResult.name,
                        actions.parse,
                    )

                    const resultNode = actions.parse(testResult.value)

                    if (nameExtraction.type === 'identifier') {
                        const node = new SetVariable(
                            nameExtraction.name,
                            resultNode,
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
                        }
                    } else {
                        return {
                            instance: new SetToIndex(
                                new IndexFetch(
                                    nameExtraction.target,
                                    nameExtraction.index,
                                    testResult.name,
                                ),
                                resultNode,
                                testResult.operator,
                                line.validTokens,
                            ),
                        }
                    }
                },
            },
        ],
    },
}

function extractName(
    nameTokens: Token[],
    parse: (tokens: Token[]) => Evaluable,
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
            target: parse(indexSetterPatternResult.target),
            index: parse(indexSetterPatternResult.index),
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
