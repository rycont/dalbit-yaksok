import { Expression, Identifier } from '../../../../../node/base.ts'
import { Block } from '../../../../../node/block.ts'
import { DeclareFunction } from '../../../../../node/function.ts'
import { TupleLiteral } from '../../../../../node/list.ts'
import { EOL } from '../../../../../node/misc.ts'
import { Token } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { functionHeaderToPattern } from './common.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '약속',
    },
    {
        type: Expression,
        value: ',',
    },
]

const SUFFIX: PatternUnit[] = [
    {
        type: EOL,
    },
    {
        type: Block,
    },
]

export function tokensToYaksokDeclareRule(headerTokens: Token[]): Rule {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const pattern = [...PREFIX, ...headerPattern, ...SUFFIX]

    return {
        pattern,
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block

            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            const paramNames = extractParamNamesFromNodes(nodes)

            return new DeclareFunction(
                {
                    body,
                    name,
                    paramNames,
                },
                matchedNodes,
            )
        },
    }
}

function extractParamNamesFromNodes(nodes: unknown[]): string[] | undefined {
    const tupleNode = nodes.find((n) => n instanceof TupleLiteral) as
        | TupleLiteral
        | undefined
    if (!tupleNode || tupleNode.items.length === 0) {
        return undefined
    }
    const names = tupleNode.items
        .map((item) => (item instanceof Identifier ? item.value : null))
        .filter((v): v is string => v !== null)
    return names.length === tupleNode.items.length ? names : undefined
}
