import { Evaluable, Expression, Identifier } from '../../../node/base.ts'
import {
    DictLiteral,
    KeyValuePair,
    KeyValuePairSequence,
} from '../../../node/dict.ts'
import { EOL } from '../../../node/misc.ts'
import { Rule } from '../type.ts'

export const DICT_RULES: Rule[] = [
    {
        pattern: [
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: ':',
            },
            {
                type: Evaluable,
            },
        ],
        factory: (nodes, tokens) => {
            const name = nodes[0].value as string
            const entry = nodes[2] as Evaluable

            return new KeyValuePair(name, entry, tokens)
        },
    },
    {
        pattern: [
            {
                type: KeyValuePair,
            },
            {
                type: Expression,
                value: ',',
            },
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0] as KeyValuePair
            pair.tokens = tokens

            return pair
        },
    },
    {
        pattern: [
            {
                type: KeyValuePair,
            },
            {
                type: EOL,
            },
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0] as KeyValuePair
            pair.tokens = tokens

            return pair
        },
    },
    {
        pattern: [
            {
                type: KeyValuePairSequence,
            },
            {
                type: EOL,
            },
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0] as KeyValuePairSequence
            pair.tokens = tokens

            return pair
        },
    },
    {
        pattern: [
            {
                type: KeyValuePairSequence,
            },
            {
                type: Expression,
                value: ',',
            },
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[0] as KeyValuePairSequence
            pair.tokens = tokens

            return pair
        },
    },
    {
        pattern: [
            {
                type: KeyValuePair,
            },
            {
                type: KeyValuePair,
            },
        ],
        factory: (nodes, tokens) => {
            const left = nodes[0] as KeyValuePair
            const right = nodes[1] as KeyValuePair

            const pairs = [left, right]
            return new KeyValuePairSequence(pairs, tokens)
        },
    },
    {
        pattern: [
            {
                type: KeyValuePairSequence,
            },
            {
                type: KeyValuePair,
            },
        ],
        factory: (nodes, tokens) => {
            const left = nodes[0] as KeyValuePairSequence
            const right = nodes[1] as KeyValuePair
            const pairs = [...left.pairs, right]
            return new KeyValuePairSequence(pairs, tokens)
        },
    },
    {
        pattern: [
            {
                type: Expression,
                value: '{',
            },
            {
                type: KeyValuePairSequence,
            },
            {
                type: Expression,
                value: '}',
            },
        ],
        factory: (nodes, tokens) => {
            const sequence = nodes[1] as KeyValuePairSequence
            return new DictLiteral(sequence.pairs, tokens)
        },
    },
    {
        pattern: [
            {
                type: Expression,
                value: '{',
            },
            {
                type: KeyValuePair,
            },
            {
                type: Expression,
                value: '}',
            },
        ],
        factory: (nodes, tokens) => {
            const pair = nodes[1] as KeyValuePair
            return new DictLiteral([pair], tokens)
        },
    },
    {
        pattern: [
            {
                type: Expression,
                value: '{',
            },
            {
                type: Expression,
                value: '}',
            },
        ],
        factory: (_, tokens) => {
            return new DictLiteral([], tokens)
        },
    },
]
