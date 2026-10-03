import { TOKEN_TYPE, tokenize } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

const c = j.list([
    j.field({
        type: j.literal(TOKEN_TYPE.IDENTIFIER),
        value: j.literal('약속'),
    }),
    j.field({
        type: j.literal(TOKEN_TYPE.COMMA),
    }),
    j.space().select('s'),
    j.field({
        value: j.literal('를'),
    }),
    j.space().select('r'),
    j.field({
        type: j.literal(TOKEN_TYPE.IDENTIFIER),
        value: j.literal('먹기'),
    }),
])

const matcher = c.compile()
const r = matcher.func(
    matcher.id,
    tokenize(`약속, (음식)을/를 (사람)와/과 먹기`),
)

if (r) {
    console.log(r.s)
}
