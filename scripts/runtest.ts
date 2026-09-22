import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        await Deno.readTextFile('./test/codes/optional-parameter.yak'),
    )
    .run()
