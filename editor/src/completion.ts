import {
    CompletionContext,
    CompletionResult,
    snippetCompletion,
} from '@codemirror/autocomplete'
import { codeFileStore } from './state.ts'
import {
    Block,
    EOL,
    Evaluable,
    Identifier,
    PatternUnit,
    SuggestableStatement,
} from '@dalbit-yaksok/core'

interface ValidStatements {
    pattern: PatternUnit[]
    statement: SuggestableStatement | true
}

export function completionProvider(
    context: CompletionContext,
): CompletionResult | null {
    const codeFile = context.state.field(codeFileStore)

    if (!codeFile) {
        return null
    }

    const word = context.matchBefore(/\S*/)

    if (!word) {
        return null
    }

    const dynamicRules = codeFile.ranScope?.getDynamicRules()

    if (!dynamicRules) {
        return null
    }

    const validStatements: ValidStatements[] = dynamicRules
        .map((r) => ({ pattern: r.pattern, statement: r.config?.statement }))
        .filter((r): r is ValidStatements => !!r.statement)

    const completionTemplates = validStatements.map(
        ({ pattern, statement }) => ({
            name: typeof statement === 'boolean' ? null : statement.name,
            template: pattern
                .map((p) => {
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

                    return ''
                })
                .join(' ')
                .replace('\n ', '\n')
                .replace(' \n', '\n'),
        }),
    )

    return {
        from: word.from,
        options: completionTemplates.map((s) =>
            snippetCompletion(s.template, {
                label: s.name || s.template,
            }),
        ),
        filter: false,
    }
}
