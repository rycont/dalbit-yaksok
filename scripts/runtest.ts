import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule(
    'main',
    await Deno.readTextFile('test/codes/function-variants.yak'),
)

// await session.runModule(['main'])
