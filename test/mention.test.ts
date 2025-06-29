import { assertEquals } from 'assert'
import { YaksokSession } from '@dalbit-yaksok/core'

Deno.test('Mentioning', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.addModules({
        코레일: `
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
        `.trim(),
        main: `
"청량리부터 안동까지 KTX 이음을 타면" 보여주기
(@코레일 (@차종 KTX이음)으로 (@역간거리 "청량리" 부터 "안동" 까지)km을 이동할 때 운임) + "원" 보여주기

"판교부터 충주까지 무궁화호를 타면" 보여주기
(@코레일 (@차종 무궁화호)으로 (@역간거리 "판교" 부터 "충주" 까지)km을 이동할 때 운임) + "원" 보여주기

@코레일 출발하기
        `,
        역간거리: `
약속, (역1)부터 (역2)까지
    만약 역1 == "청량리" 이고 역2 == "안동" 이면
        235.3 반환하기
    만약 역1 == "판교" 이고 역2 == "충주" 이면
        140.9 반환하기
    `,
        차종: `
KTX이음 = "KTX-이음"
무궁화호 = "무궁화호"
`,
    })

    await session.runModule('main')

    assertEquals(
        output,
        `청량리부터 안동까지 KTX 이음을 타면
32977.06원
판교부터 충주까지 무궁화호를 타면
9158.5원
빵빵
`,
    )
})

Deno.test('Mentioning with variable in parameter', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })
    session.addModule(
        '하랑봇',
        `약속, (내용) 말하기
    내용 + "? 어쩌라고." 보여주기

날씨 = "비"`,
    )

    session.addModule(
        'main',
        `할말 = "뭐라고"
@하랑봇 할말 말하기
@하랑봇 (@하랑봇 날씨) 말하기`,
    )

    await session.runModule('main')

    assertEquals(
        output,
        `뭐라고? 어쩌라고.
비? 어쩌라고.
`,
    )
})
