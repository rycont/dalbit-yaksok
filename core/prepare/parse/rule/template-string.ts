import {
    Evaluable,
    Expression,
    Rule,
    StringStaticPart,
    StringPartSequence,
    r,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

export const STRING_RULES: Rule[] = [
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('"') }),
            j.instance(StringStaticPart),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(nodes, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal("'") }),
            j.instance(StringStaticPart),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(nodes, tokens)
        },
    }),
    r({
        pattern: [j.instance(StringPartSequence), j.instance(StringStaticPart)],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const staticPart = nodes[1]
            return new StringPartSequence(
                sequence.subnode.concat([staticPart]),
                tokens,
            )
        },
    }),
    r({
        pattern: [
            j.instance(StringStaticPart),
            j.instance(Expression).field({ value: j.literal('"') }),
        ],
        factory(nodes, tokens) {
            return new StringPartSequence(nodes, tokens)
        },
    }),
    r({
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
    }),
    r({
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
    }),
    r({
        pattern: [
            j.instance(StringPartSequence),
            j.instance(Expression).field({ value: j.literal('{') }),
            j.instance(Evaluable),
            j.instance(Expression),
        ],
        factory(nodes, tokens) {
            const sequence = nodes[0]
            const evaluable = nodes[2]
            return new StringPartSequence(
                sequence.subnode.concat([evaluable]),
                tokens,
            )
        },
    }),
]
