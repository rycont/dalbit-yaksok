import { Chain } from './condition/index.ts'

class Something {
    public name = 'Sample'
    public nested = {
        what: 'are',
    }
}

const j = Chain

const r = j.instance(Something).field({
    name: j.enum(['sample', 'Sample']).select('firstletter', (s) => s[0]),
    nested: j.field({
        what: j.literal('are'),
    }),
})

const built = r.build()
const matchResult = built.func(built.id, new Something())
