import {
    AmbiguousFormulaBoundary,
    DirectReplacer,
    Evaluable,
    Formula,
    IncompleteEvaluable,
    Mention,
    MentionRequiresRunFrame,
    parseValue,
    RDRule,
    Scope,
    SRRule,
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
        const fileScope = file.ast.scope

        const rulesPool = new Set(
            (fileScope.ruleList.rd as (RDRule | SRRule)[]).concat(
                fileScope.ruleList.sr,
            ),
        )

        const parsed = parseValue(
            rangeTokens,
            scope.session.files[fileName].ast.scope,
            {
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
            },
        )

        const internalInstance =
            parsed.length === 1 && parsed[0] instanceof Evaluable
                ? parsed[0]
                : new IncompleteEvaluable(parsed, rangeTokens)

        const lastNodeTokens = parsed[parsed.length - 1].tokens
        const lastToken = lastNodeTokens[lastNodeTokens.length - 1]
        const lastTokenIndex = allTokens.indexOf(lastToken)

        if (file.ranFrame) {
            return {
                tokenRange: [startIndex, lastTokenIndex],
                instance: new Mention(
                    internalInstance,
                    file.ranFrame,
                    rangeTokens,
                ),
            }
        }

        const instance = new IncompleteEvaluable(
            [internalInstance],
            rangeTokens,
        )

        instance.parsingErrors.push(
            new MentionRequiresRunFrame({
                node: internalInstance,
                tokens: rangeTokens,
                scope: scope,
            }),
        )

        return {
            tokenRange: [startIndex, lastTokenIndex],
            instance,
        }
    }
