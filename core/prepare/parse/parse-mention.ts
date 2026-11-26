import {
    AmbiguousFormulaBoundary,
    DirectReplacer,
    Evaluable,
    FileForRunNotExistError,
    Formula,
    hasReferenceSlot,
    IncompleteEvaluable,
    Mention,
    MentionRequiresRunFrame,
    parseValue,
    RDRule,
    ReferenceSlot,
    Scope,
    SRRule,
    StatementCaller,
    Token,
    TOKEN_TYPE,
} from '@dalbit-yaksok/core'
import { HookAction } from './srParse'

export function getMentionReplacers(
    tokens: Token[],
    scope: Scope,
): DirectReplacer[] {
    const mentionIndexes = tokens.flatMap((t, i) =>
        t.type === TOKEN_TYPE.MENTION ? [i] : [],
    )

    const replacers = mentionIndexes.map(createReplacer(scope, tokens))
    return replacers
}

const createReplacer =
    (scope: Scope, allTokens: Token[]) =>
    (
        startIndex: number,
        indexSequence: number,
        allIndexes: number[],
    ): DirectReplacer => {
        const rangeTokens = allTokens.slice(
            startIndex + 1,
            indexSequence + 1 === allIndexes.length
                ? undefined
                : allIndexes[indexSequence + 1],
        )

        const fileName = allTokens[startIndex].value.slice(1)

        const file = scope.session.files[fileName]

        if (!file) {
            const instance = new IncompleteEvaluable(
                [],
                [allTokens[startIndex]],
            )

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
            const instance = new IncompleteEvaluable(
                [],
                [allTokens[startIndex]],
            )

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

        const rulesPool = new Set(
            (fileScope.ruleList.rd as (RDRule | SRRule)[]).concat(
                fileScope.ruleList.sr,
            ),
        )

        const fakeScopeForParsing = new Scope({
            parent: scope,
        })

        fakeScopeForParsing.ruleList = {
            sr: scope.session.files[fileName].ast.scope.ruleList.sr,
            rd: [],
        }

        const parsed = parseValue(rangeTokens, fakeScopeForParsing, {
            onReduce(r, s) {
                if (rulesPool.has(r)) {
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
                instance: new StatementCaller((code, parse, scope) => {
                    const statementParseResult = internalInstance.toStatement(
                        code,
                        parse,
                        scope,
                    )

                    if (!statementParseResult) {
                        return null
                    }

                    const parsedStatement = statementParseResult.instance

                    if (!hasReferenceSlot(parsedStatement)) {
                        return statementParseResult
                    }

                    return {
                        consumed: statementParseResult.consumed,
                        instance: {
                            execute(runFrame) {
                                const childFrame = runFrame.createChild(
                                    parsedStatement.scope,
                                )
                                const reference = this.declaredFrame.get(
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
                }),
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
