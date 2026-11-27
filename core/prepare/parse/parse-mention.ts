import {
    AmbiguousFormulaBoundary,
    createLineFetcher,
    DirectReplacer,
    Evaluable,
    FileForRunNotExistError,
    Formula,
    hasReferenceSlot,
    IncompleteEvaluable,
    Mention,
    MentionRequiresRunFrame,
    parseValue,
    ReferenceSlot,
    Scope,
    StatementCaller,
    Token,
    TOKEN_TYPE,
    TokenLine,
} from '@dalbit-yaksok/core'
import { HookAction } from './srParse'

export function getMentionReplacers(
    tokens: readonly Token[],
    scope: Scope,
): readonly DirectReplacer[] {
    const mentionIndexes = tokens.flatMap((t, i) =>
        t.type === TOKEN_TYPE.MENTION ? [i] : [],
    )

    let replacers: readonly DirectReplacer[] = []

    for (const index of mentionIndexes) {
        if (replacers.some((r) => index <= r.tokenRange[1])) {
            continue
        }

        const replacer = createReplacer(index, scope, tokens)
        replacers = replacers.concat(replacer)
    }

    return replacers
}

const createReplacer = (
    startIndex: number,
    scope: Scope,
    allTokens: readonly Token[],
): DirectReplacer => {
    const rangeTokens = allTokens.slice(startIndex + 1)

    const fileName = allTokens[startIndex].value.slice(1)

    const file = scope.session.files[fileName]

    if (!file) {
        const instance = new IncompleteEvaluable([], [allTokens[startIndex]])

        instance.parsingErrors = [
            new FileForRunNotExistError({
                resource: {
                    fileName,
                    files: Object.keys(scope.session.files),
                },
                scope,
                node: instance,
            }),
        ]

        return {
            tokenRange: [startIndex, startIndex],
            instance,
        }
    }

    if (!file.ranFrame) {
        const instance = new IncompleteEvaluable([], [allTokens[startIndex]])

        instance.parsingErrors.push(
            new MentionRequiresRunFrame({
                node: instance,
                tokens: rangeTokens,
                scope: scope,
            }),
        )

        return {
            tokenRange: [startIndex, startIndex],
            instance,
        }
    }

    const fileScope = file.ast.scope

    const fakeScopeForParsing = new Scope({
        parent: scope,
    })

    fakeScopeForParsing.ruleList = {
        sr: fileScope.ruleList.sr,
        rd: [],
    }

    fakeScopeForParsing.slots = new Map(fileScope.slots)

    const parsed = parseValue(rangeTokens, fakeScopeForParsing, {
        onShifted(node) {
            if (
                hasReferenceSlot(node) &&
                fileScope.slots.has(node[ReferenceSlot])
            ) {
                return HookAction.EARLY_STOP
            }
        },
        onReduced(_, s) {
            if (hasReferenceSlot(s) && fileScope.slots.has(s[ReferenceSlot])) {
                return HookAction.EARLY_STOP
            }

            if (
                s instanceof Formula &&
                s.parsingErrors.some(
                    (e) => e instanceof AmbiguousFormulaBoundary,
                )
            ) {
                return HookAction.EARLY_STOP
            }
        },
    })

    const lastNodeTokens = parsed[parsed.length - 1].tokens
    const lastToken = lastNodeTokens[lastNodeTokens.length - 1]
    const lastTokenIndex = allTokens.indexOf(lastToken)

    const internalInstance = parsed[0]
    // console.log(internalInstance)
    const isInvalid =
        parsed.length !== 1 || !(internalInstance instanceof Evaluable)

    if (isInvalid) {
        const instance = new IncompleteEvaluable(
            [internalInstance],
            rangeTokens,
        )

        return {
            tokenRange: [startIndex, lastTokenIndex],
            instance,
        }
    }

    if (internalInstance instanceof StatementCaller) {
        return {
            tokenRange: [startIndex, lastTokenIndex],
            instance: new StatementCaller(
                scope,
                (rawCode, parse, scope) => {
                    const firstLine = rawCode.look
                    const mentionSlicedLine: TokenLine = {
                        level: firstLine.level,
                        rawRange: firstLine.rawRange,
                        validTokens: firstLine.validTokens.slice(1),
                    }

                    const lineFetcher = createLineFetcher<true>(
                        [mentionSlicedLine].concat(rawCode.lines.slice(1)),
                    )

                    const statementParseResult = internalInstance.toStatement(
                        lineFetcher,
                        parse,
                        scope,
                    )

                    if (!statementParseResult) {
                        throw '말이안됨'
                    }

                    const parsedStatement = statementParseResult.instance

                    return {
                        consumed: statementParseResult.consumed,
                        instance: {
                            execute(runFrame) {
                                if (!hasReferenceSlot(parsedStatement)) {
                                    return parsedStatement.execute(runFrame)
                                }

                                const childFrame = runFrame.createChild(
                                    parsedStatement.scope,
                                )

                                const reference = file.ranFrame!.get(
                                    parsedStatement[ReferenceSlot],
                                )

                                childFrame.set(
                                    parsedStatement[ReferenceSlot],
                                    reference,
                                )

                                return parsedStatement.execute(childFrame)
                            },
                            parsingErrors: parsedStatement.parsingErrors,
                            scope: parsedStatement.scope,
                            tokens: parsedStatement.tokens,
                            validate:
                                parsedStatement.validate.bind(parsedStatement),
                        },
                    }
                },
                allTokens.slice(startIndex, lastTokenIndex),
            ),
        }
    }

    return {
        tokenRange: [startIndex, lastTokenIndex],
        instance: new Mention(
            fileName,
            internalInstance,
            file.ranFrame,
            rangeTokens,
        ),
    }
}
