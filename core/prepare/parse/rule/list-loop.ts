import { Block, EOL, Evaluable, Identifier } from '../../../node/index.ts'
import { ListLoop } from '../../../node/listLoop.ts'
import { CompletionGroup, Rule } from '../type.ts'

export const LIST_LOOP_RULES: Rule[] = [
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('의') }),
            j.instance(Identifier),
            j.instance(Identifier).field({ value: j.literal('마다') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[1]
            const name = nodes[3].value
            const body = nodes[6]

            return new ListLoop(list, name, body, tokens)
        },
        config: {
            statement: {
                name: '목록에서 하나 하나 반복하기',
                group: CompletionGroup.LOOP,
                visibility: 'always',
            },
        },
    },
    {
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('의') }),
            j.instance(Identifier),
            j.instance(Identifier).field({ value: j.literal('마다') }),
            j.instance(Identifier).field({ value: j.literal('반복하기') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0]
            const name = nodes[2].value
            const body = nodes[6]

            return new ListLoop(list, name, body, tokens)
        },
        config: { statement: true },
    },
    {
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('의') }),
            j.instance(Identifier),
            j.instance(Identifier).field({ value: j.literal('마다') }),
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0]
            const name = nodes[2].value
            const body = nodes[6]

            return new ListLoop(list, name, body, tokens)
        },
        config: { statement: true },
    },
]
