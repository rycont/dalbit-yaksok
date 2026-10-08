import { Expression, Identifier } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

const r = j
    .list([
        j
            .instance(Identifier)
            .field({
                value: j.literal('엥').select(),
            })
            .select(),
        j.instance(Expression).select('오'),
    ])
    .compile()
