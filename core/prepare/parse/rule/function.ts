import {
    FunctionDeclareHeader,
    DeclareFunction,
    Rule,
    Block,
    EOL,
    r,
} from '@dalbit-yaksok/core'

export const FUNCTION_RULES: Rule[] = [
    r({
        pattern: [FunctionDeclareHeader, EOL, Block],
        factory(nodes, tokens) {
            const [header, _, body] = nodes

            return new DeclareFunction(
                body,
                header.name,
                header.invokingRules,
                [],
                tokens,
            )
        },
    }),
]
