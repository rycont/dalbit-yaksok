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
            {
                type: Expression,
                value: '"',
            },
            {
                type: StringStaticPart,
            },
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes as [Expression, StringStaticPart],
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: Expression,
                value: "'",
            },
            {
                type: StringStaticPart,
            },
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes as [Expression, StringStaticPart],
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: StringPartSequence,
            },
            {
                type: StringStaticPart,
            },
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0] as StringPartSequence
            const staticPart = nodes[1] as StringStaticPart
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: StringStaticPart,
            },
            {
                type: Expression,
                value: '"',
            },
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(
                nodes as [StringStaticPart, Expression],
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: StringPartSequence,
            },
            {
                type: Expression,
                value: '"',
            },
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0] as StringPartSequence
            const staticPart = nodes[1] as StringStaticPart
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: StringPartSequence,
            },
            {
                type: Expression,
                value: "'",
            },
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0] as StringPartSequence
            const staticPart = nodes[1] as StringStaticPart
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    },
    {
        pattern: [
            {
                type: StringPartSequence,
            },
            {
                type: Expression,
                value: '{',
            },
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: '}',
            },
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0] as StringPartSequence
            const evaluable = nodes[2] as StringInterpolationPart
            return new StringPartSequence(
                sequence.subnode.concat([evaluable]),
                tokens,
            )
        },
    },
]
