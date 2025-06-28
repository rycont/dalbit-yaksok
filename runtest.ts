import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session.runModule(
    '차종',
    `
KTX이음 = "KTX-이음"
무궁화호 = "무궁화호"
`,
)

await session.runModule(
    '코레일',
    `
약속, (차종)으로 (거리)km을 이동할 때 운임
    만약 차종 == @차종 KTX이음 이면
        만약 거리 <= 60 이면
            8400 반환하기
        아니면
            8400 + (거리 - 60) * 140.2 반환하기

    만약 차종 == @차종 무궁화호 이면
        만약 거리 <= 40 이면
            2600 반환하기
        아니면
            2600 + (거리 - 40) * 65 반환하기

약속, 출발하기
    "빵빵" 보여주기
`,
)

await session.run('@코레일 출발하기')
