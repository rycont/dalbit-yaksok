import { yaksok } from '@dalbit-yaksok/core'

await yaksok(
    `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    {
        runFFI(runtime) {
            if (runtime === 'mock') {
                return 'invalid value' as any
            }

            throw new Error(`Unknown runtime: ${runtime}`)
        },
    },
)
