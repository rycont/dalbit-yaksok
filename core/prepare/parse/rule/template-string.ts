import {
    Evaluable,
    Expression,
    Rule,
    StringInterpolationPart,
    StringStaticPart,
} from '@dalbit-yaksok/core'
import { StringPartSequence } from '../../../node/primitive-literals/string.ts'

export const STRING_RULES: Rule[] = [
    {
        pattern: [
            j.instance(Expression).field({ value: j.literal('"') }),
            j.instance(StringStaticPart),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes,
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(Expression).field({ value: j.literal("'") }),
            j.instance(StringStaticPart),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes,
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(StringPartSequence),
            j.instance(StringStaticPart),
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const staticPart = nodes[1]
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(StringStaticPart),
            j.instance(Expression).field({ value: j.literal('"') }),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(StringPartSequence),
            j.instance(Expression).field({ value: j.literal('"') }),
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const staticPart = nodes[1]
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(StringPartSequence),
            j.instance(Expression).field({ value: j.literal("'") }),
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const staticPart = nodes[1]
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            j.instance(StringPartSequence),
            j.instance(Expression).field({ value: j.literal('{') }),
            j.instance(Evaluable),
            j.instance(Expression)
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const evaluable = nodes[2]
            return new StringPartSequence(
                sequence.subnode.concat([evaluable]),
                tokens,
            )
        },
    },
]
