import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule('main', await Deno.readTextFile('test/codes/call-forms.yak'))
    .run()
