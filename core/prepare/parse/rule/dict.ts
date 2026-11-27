import {
    DictLiteral,
    Expression,
    KeyValuePair,
    KeyValuePairSequence,
    r,
    SRRule,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

export const DICT_RULES: SRRule[] = [
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('{') }),
            j.instance(KeyValuePairSequence),
            j.instance(Expression).field({ value: j.literal('}') }),
        ],
        factory: (nodes, tokens) => {
            const sequence = nodes[1]
            return new DictLiteral(sequence.subnode, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('{') }),
            j.instance(KeyValuePair),
            j.instance(Expression).field({ value: j.literal('}') }),
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[1]
            return new DictLiteral([pair], tokens)
        },
    }),
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('{') }),
            j.instance(Expression).field({ value: j.literal('}') }),
        ],
        factory: (_, tokens) => {
            return new DictLiteral([], tokens)
        },
    }),
]
