import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession();
await session.run(`
자리 = [
    [ 1, 2, 3 ],
    [ 4, 5, 6 ],
    [ 7, 8, 9 ],
    [
        10, 11, 12
    ]
]
자리 보여주기
`)
