import { PatternUnit } from '@dalbit-yaksok/core'
import {
    Evaluable,
    Expression,
    Identifier,
    type Node,
} from '../../node/base.ts'
import { EOL } from '../../node/misc.ts'
import { Rule } from './rule/index.ts'

export function splitVariableName(
    nodes: Node[],
    inheritedIdentifiers: string[] = [],
    rules: Rule[] = [],
): Node[] {
    const definedVariables = getDefinedVariables(nodes)

    const patterns = rules.map((r) => r.pattern)
    const suffixes = getParameterSuffixes(patterns)

    return nodes
}

function getParameterSuffixes(patterns: PatternUnit[][]) {
    const suffixes = patterns.flatMap((p) =>
        p.flatMap((u, i) => {
            if (u.type !== Evaluable) {
                return []
            }

            const suffix = p[i + 1]
            if (!suffix || !suffix.isSuffix || !suffix.value) {
                return []
            }

            return suffix.value
        }),
    )

    const uniqueSuffixes = Array.from(new Set(suffixes))

    return uniqueSuffixes
}

function getDefinedVariables(nodes: Node[]) {
    const variableNames = nodes.flatMap((node, index) => {
        const isEqualSign = node instanceof Expression && node.value === '='

        if (!isEqualSign) {
            return []
        }

        const hasPrecedingEOL = nodes[index - 2] instanceof EOL

        if (!hasPrecedingEOL) {
            return []
        }

        const 둘_사이에_끼어있는_노드 = nodes[index - 1]

        if (둘_사이에_끼어있는_노드 instanceof Identifier) {
            return [둘_사이에_끼어있는_노드.value]
        }

        return []
    })

    return variableNames
}
