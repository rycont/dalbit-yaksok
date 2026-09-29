import { Chain } from './condition/index.ts'

class Something {
    public name = 'Sample'
    public nested = {
        what: 'are',
    }
}

const j = Chain

const e = j.field({
    notFound: j.literal(100),
})

const r = j.instance(Something).field({
    name: j.literal(0).select('hi'),
    nested: e,
})

const g = j.instance(Something).field({
    name: j.literal('Sample').select('hi'),
})

console.log(r.build())
