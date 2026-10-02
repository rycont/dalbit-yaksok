import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'A',
        `약속, 샤갈하기
    "인생 샤~갈~~!" 보여주기
    "여기가 아무리 길어도" 보여주기
    "스로틀은 안걸림" 보여주기`,
    )
    .run()

await session
    .addModule(
        'B',
        `10번 반복
    @A 샤갈하기

"스로틀은 실제 런이 붙은 파일에만" 보여주기`,
    )
    .run({
        throttle: 100,
    })
