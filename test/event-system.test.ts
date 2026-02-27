import { dalbitToJS, YaksokSession } from '../core/mod.ts'
import { assertEquals } from '@std/assert'

Deno.test('이벤트 구독 및 실행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이벤트 실행됨" 보여주기
`,
    )

    // Run the module. It should register the event listener.

    session.eventCreation.sub('TEST_EVENT', (_, callback, terminate) => {
        callback()
        callback()
        callback()

        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '이벤트 실행됨\n이벤트 실행됨\n이벤트 실행됨\n')
})

Deno.test('여러 이벤트 구독 및 실행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 (A) 이벤트

테스트 "1" 이벤트
    "이벤트 1 실행됨" 보여주기

테스트 "2" 이벤트
    "이벤트 2 실행됨" 보여주기
`,
    )

    // Run the module. It should register the event listener.

    session.eventCreation.sub('TEST_EVENT', (args, callback, terminate) => {
        if (dalbitToJS(args.A) === '1') {
            callback()
            terminate()
        }

        if (dalbitToJS(args.A) === '2') {
            setTimeout(() => {
                callback()
                terminate()
            }, 100)
        }
    })

    await session.runModule('main')

    assertEquals(output, '이벤트 1 실행됨\n이벤트 2 실행됨\n')
})

Deno.test('이벤트 밖에서 선언된 변수를 이벤트 안에서 읽기', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

메시지 = "안녕하세요"

테스트 이벤트
    메시지 보여주기
`,
    )

    session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
        await callback()
        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '안녕하세요\n')
})

Deno.test('이벤트 안에서 외부 변수를 조건문에 사용하기', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

상태 = "정지 중"

테스트 이벤트
    만약 상태 == "정지 중" 이면
        "출발" 보여주기
        상태 = "가는 중"
    아니면
        "정지" 보여주기
        상태 = "정지 중"
`,
    )

    session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
        await callback()
        await callback()
        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '출발\n정지\n')
})

Deno.test('이벤트 안에서 외부 변수를 조건문에 사용하기 (단일 콜백)', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

상태 = "정지 중"

테스트 이벤트
    만약 상태 == "정지 중" 이면
        "출발" 보여주기
`,
    )

    session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
        await callback()
        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '출발\n')
})

Deno.test('이벤트 안에서 외부 변수 수정하기', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

상태 = "정지 중"

테스트 이벤트
    상태 보여주기
    상태 = "가는 중"
    상태 보여주기
`,
    )

    session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
        await callback()
        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '정지 중\n가는 중\n')
})
