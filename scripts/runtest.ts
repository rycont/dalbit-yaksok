import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'var',
        `모듈변수 = 21
약속, 진짜 대단한 이름을 (횟수)번 보여줘
    모듈변수 보여주기
    이름 = "길동"
    모듈변수 += 횟수
    횟수 번 반복
        이름 보여주기
    모듈변수 반환하기`,
    )
    .run()

await session
    .addModule(
        'main',
        `모듈변수 = 99
모듈변수 보여주기
@var 진짜 대단한 이름을 10번 보여줘 보여주기
모듈변수 보여주기`,
    )
    .run()
