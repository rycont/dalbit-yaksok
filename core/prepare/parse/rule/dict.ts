import {
    DictLiteral,
    EOL,
    Evaluable,
    Expression,
    Identifier,
    KeyValuePair,
    KeyValuePairSequence,
    NumberLiteral,
    r,
    Rule,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

export const DICT_RULES: Rule[] = [
    r({
        pattern: [
            j.instance(Identifier),
            j.instance(Expression).field({ value: j.literal(':') }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const name = nodes[0].value
            const entry = nodes[2]

            return new KeyValuePair(name, entry, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(NumberLiteral),
            j.instance(Expression).field({ value: j.literal(':') }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const keyLiteral = nodes[0]
            const entry = nodes[2]

            return new KeyValuePair(keyLiteral.toNumber(), entry, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(KeyValuePair),
            j.instance(Expression).field({ value: j.literal(',') }),
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0]
            pair.tokens = tokens

            return pair
        },
    }),
    r({
        pattern: [j.instance(KeyValuePair), j.instance(EOL)],
        factory: (nodes, tokens) => {
            const pair = nodes[0]
            pair.tokens = tokens

            return pair
        },
    }),
    r({
        pattern: [j.instance(KeyValuePairSequence), j.instance(EOL)],
        factory: (nodes, tokens) => {
            const pair = nodes[0]
            pair.tokens = tokens

            return pair
        },
    }),
    r({
        pattern: [
            j.instance(KeyValuePairSequence),
            j.instance(Expression).field({ value: j.literal(',') }),
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0]
            pair.tokens = tokens

            return pair
        },
    }),
    r({
        pattern: [j.instance(KeyValuePair), j.instance(KeyValuePair)],
        factory: (nodes, tokens) => {
            const left = nodes[0]
            const right = nodes[1]

            const pairs = [left, right]
            return new KeyValuePairSequence(pairs, tokens)
        },
    }),
    r({
        pattern: [j.instance(KeyValuePairSequence), j.instance(KeyValuePair)],
        factory: (nodes, tokens) => {
            const left = nodes[0]
            const right = nodes[1]
            const pairs = [...left.subnode, right]
            return new KeyValuePairSequence(pairs, tokens)
        },
    }),
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
