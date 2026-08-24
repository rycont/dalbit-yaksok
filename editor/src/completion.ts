import {
    CompletionContext,
    CompletionResult,
    snippetCompletion,
} from '@codemirror/autocomplete'
import { validationResultStore } from './state.ts'
import {
    Block,
    EOL,
    Evaluable,
    Identifier,
    RULE_FLAGS,
} from '@dalbit-yaksok/core'

export function completionProvider(
    context: CompletionContext,
): CompletionResult | null {
    const validationResult = context.state.field(validationResultStore)
    console.log(validationResult)

    if (!validationResult) {
        return null
    }

    const word = context.matchBefore(/\S*/)

    if (!word) {
        return null
    }

    const statements =
        validationResult.validatingScope.codeFile?.appliedRules?.filter((r) =>
            r.flags?.includes(RULE_FLAGS.IS_STATEMENT),
        )

    if (!statements) {
        return null
    }

    const statementStrings = statements
        .map((s) =>
            s.pattern.map((p) => {
                if (p.value) {
                    return p.value
                }

                if (p.type === EOL) {
                    return '\n'
                }

                if (p.type === Evaluable) {
                    return '${값}'
                }

                if (p.type === Identifier) {
                    return '${인자}'
                }

                if (p.type === Block) {
                    return '\t${내용}'
                }

                return null
            }),
        )
        .filter((s) => !s.includes(null))
        .map((s) => s.join(' ').replace('\n ', '\n').replace(' \n', '\n'))

    return {
        from: word.from,
        options: statementStrings.map((s) =>
            snippetCompletion(s, {
                label: s,
            }),
        ),
        filter: false,
    }
}
