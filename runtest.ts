import { yaksok, YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession({
    stderr(message) {
        console.error(message)
    },
})
await session.extend(new QuickJS())
const result = await yaksok({})
// console.log(result)
