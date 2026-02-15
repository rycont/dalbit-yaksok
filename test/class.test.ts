import {
    assertEquals,
    assertStringIncludes,
} from 'https://deno.land/std@0.201.0/testing/asserts.ts'
import { YaksokSession } from '../core/mod.ts'

async function runAndCollect(code: string): Promise<string[]> {
    const outputs: string[] = []
    const session = new YaksokSession({
        stdout: (msg: string) => {
            outputs.push(msg)
        },
    })

    session.addModule('main', code)
    const results = await session.runModule('main')
    const result = results.get('main')!
    if (result.reason === 'error') throw result.error
    if (result.reason === 'validation') {
        const errMsgs: string[] = []
        for (const [key, errs] of result.errors) {
            errMsgs.push(`${key}: ${errs.map((e) => e.message).join(', ')}`)
        }
        throw new Error('Validation failed: ' + errMsgs.join('; '))
    }

    return outputs
}

Deno.test('클래스 선언 및 인스턴스 생성', async () => {
    const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
        자신.나이 = 10

    약속, (음료) 마시기
        자신.이름 + "(이)가 " + 음료 + " 마심" 반환하기

나 = 새 사람("정한")
나.나이 보여주기
나. "물" 마시기 보여주기
`)

    assertEquals(outputs[0], '10')
    assertEquals(outputs[1], '정한(이)가 물 마심')
})

Deno.test('클래스 멤버 변수 수정', async () => {
    const outputs = await runAndCollect(`
클래스, 카운터
    값 = 0
    약속, 증가
        자신.값 = 자신.값 + 1

c = 새 카운터
c.값 보여주기
c. 증가
c.값 보여주기
`)

    assertEquals(outputs[0], '0')
    assertEquals(outputs[1], '1')
})

Deno.test('멤버 조회는 전역 변수로 누수되지 않는다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
x = 99
클래스, C
    값 = 1
o = 새 C
o.x 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '멤버')
        assertStringIncludes(allMessages, 'x')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(result.error.message, '멤버')
        assertStringIncludes(result.error.message, 'x')
        return
    }

    throw new Error('멤버 조회가 전역 변수로 누수되면 안 됩니다.')
})

Deno.test('멤버 대입은 전역 변수를 덮어쓰지 않는다', async () => {
    const outputs = await runAndCollect(`
x = 10
클래스, C
    약속, 바꾸기
        자신.x = 42
o = 새 C
o.바꾸기
o.x 보여주기
x 보여주기
`)

    assertEquals(outputs[0], '42')
    assertEquals(outputs[1], '10')
})

Deno.test('클래스 생성자 다중 인수', async () => {
    const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름, 나이)
        자신.이름 = 이름
        자신.나이 = 나이

나 = 새 사람("정한", 25)
나.이름 보여주기
나.나이 보여주기
`)

    assertEquals(outputs[0], '정한')
    assertEquals(outputs[1], '25')
})

Deno.test('생성자가 없으면 전달 인수를 무시하고 생성된다', async () => {
    const outputs = await runAndCollect(`
클래스, 빈클래스
    값 = 7

객체 = 새 빈클래스(1, 2, 3)
객체.값 보여주기
`)

    assertEquals(outputs[0], '7')
})

Deno.test('멤버 접근 시 무인자 메서드 자동 호출이 동작한다', async () => {
    const outputs = await runAndCollect(`
클래스, 인사기
    약속, 인사
        "안녕" 반환하기

g = 새 인사기
g.인사 보여주기
`)

    assertEquals(outputs[0], '안녕')
})

Deno.test(
    '멤버 메서드 인자는 호출자 스코프에서 평가된다',
    async () => {
        const outputs = await runAndCollect(`
외부값 = "전역"
클래스, C
    값 = "멤버"
    약속, (x) 보기
        x 반환하기

o = 새 C
o. (외부값 보기) 보여주기
`)

        assertEquals(outputs[0], '전역')
    },
)

Deno.test(
    '멤버 자동 호출 내부 오류를 멤버 없음 오류로 마스킹하지 않는다',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
클래스, 사람
    약속, 인사
        없는값 보여주기

나 = 새 사람
나.인사 보여주기
`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')

        if (result.reason === 'validation') {
            const allMessages = [...result.errors.values()]
                .flat()
                .map((e) => e.message)
                .join('\n')
            assertStringIncludes(allMessages, '"없는값"')
            return
        }

        if (result.reason === 'error') {
            assertStringIncludes(result.error.message, '"없는값"')
            return
        }

        throw new Error('메서드 내부 식별자 오류가 발생해야 합니다.')
    },
)

Deno.test('상속: 부모 메서드와 필드를 물려받는다', async () => {
    const outputs = await runAndCollect(`
클래스, 동물
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, 소개
        자신.이름 + " 동물" 반환하기

클래스, 강아지(동물)
    약속, 짖기
        자신.이름 + " 멍멍" 반환하기

d = 새 강아지("초코")
d.소개 보여주기
d.짖기 보여주기
`)

    assertEquals(outputs[0], '초코 동물')
    assertEquals(outputs[1], '초코 멍멍')
})

Deno.test('상속: 자식 메서드가 부모 메서드를 오버라이드한다', async () => {
    const outputs = await runAndCollect(`
클래스, 동물
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, 소개
        자신.이름 + " 동물" 반환하기

클래스, 강아지(동물)
    약속, 소개
        자신.이름 + " 강아지" 반환하기

d = 새 강아지("보리")
d.소개 보여주기
`)

    assertEquals(outputs[0], '보리 강아지')
})

Deno.test('상속: 생성자 오버로드는 인수 개수로 선택된다', async () => {
    const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
        자신.나이 = 0

클래스, 학생(사람)
    약속, __준비__ (이름, 나이)
        자신.이름 = 이름
        자신.나이 = 나이

a = 새 학생("하늘")
b = 새 학생("바다", 13)
a.나이 보여주기
b.나이 보여주기
`)

    assertEquals(outputs[0], '0')
    assertEquals(outputs[1], '13')
})

Deno.test('상속: 자식 메서드에서 부모 필드를 수정할 수 있다', async () => {
    const outputs = await runAndCollect(`
클래스, 부모
    점수 = 1

클래스, 자식(부모)
    약속, 증가
        자신.점수 = 자신.점수 + 1

c = 새 자식
c.증가
c.점수 보여주기
`)

    assertEquals(outputs[0], '2')
})

Deno.test('상속: 다단계 상속에서도 부모 체인이 유지된다', async () => {
    const outputs = await runAndCollect(`
클래스, 생명체
    약속, __준비__ (이름)
        자신.이름 = 이름

클래스, 동물(생명체)
    약속, 종류
        "동물" 반환하기

클래스, 강아지(동물)
    약속, 소리
        "멍멍" 반환하기

d = 새 강아지("달이")
d.이름 보여주기
d.종류 보여주기
d.소리 보여주기
`)

    assertEquals(outputs[0], '달이')
    assertEquals(outputs[1], '동물')
    assertEquals(outputs[2], '멍멍')
})

Deno.test(
    '상위: __준비__를 호출해 부모 초기화를 재사용할 수 있다',
    async () => {
        const outputs = await runAndCollect(`
클래스, 부모
    약속, __준비__
        자신.이름 = "부모초기화"

클래스, 자식(부모)
    약속, __준비__ (나이)
        상위.__준비__
        자신.나이 = 나이

나 = 새 자식(4)
나.이름 보여주기
나.나이 보여주기
`)

        assertEquals(outputs[0], '부모초기화')
        assertEquals(outputs[1], '4')
    },
)

Deno.test(
    '상위: 상위.(...) 문법으로 부모 메서드를 호출할 수 있다',
    async () => {
        const outputs = await runAndCollect(`
클래스, 부모
    약속, (음료) 마시기
        "부모가 " + 음료 + " 마심" 반환하기

클래스, 자식(부모)
    약속, (음료) 마시기
        r = 상위.("주스" 마시기)
        "[" + r + "]" 반환하기

나 = 새 자식
나. "주스" 마시기 보여주기
`)

        assertEquals(outputs[0], '[부모가 주스 마심]')
    },
)

Deno.test(
    '상위: 다단계 상속에서도 상위 체인이 올바르게 연결된다',
    async () => {
        const outputs = await runAndCollect(`
클래스, 조상
    약속, 말하기
        "조상" 반환하기

클래스, 부모(조상)
    약속, 말하기
        상위.말하기 + "-부모" 반환하기

클래스, 자식(부모)
    약속, 테스트
        상위.말하기 보여주기
        자신.말하기 보여주기

o = 새 자식
o.테스트
`)

        assertEquals(outputs[0], '조상-부모')
        assertEquals(outputs[1], '조상-부모')
    },
)

Deno.test(
    '상속 메서드 접근: 자신.부모메서드는 validation에서 오탐지되지 않는다',
    async () => {
        const outputs = await runAndCollect(`
클래스, 부모
    약속, 인사
        "안녕" 반환하기

클래스, 자식(부모)
    약속, 테스트
        자신.인사 보여주기

o = 새 자식
o.테스트
`)

        assertEquals(outputs[0], '안녕')
    },
)

Deno.test('상위: 부모가 없으면 상위를 사용할 수 없다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, 사람
    약속, 테스트
        상위.__준비__

나 = 새 사람
나.테스트
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '"상위"')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(result.error.message, '"상위"')
        return
    }

    throw new Error('부모 없는 상위 사용 오류가 발생해야 합니다.')
})

Deno.test('상속: 부모 클래스가 아니면 오류가 난다', async () => {
    const code = `
값 = 1
클래스, 자식(값)
    약속, __준비__
        자신.x = 1
`
    const session = new YaksokSession()
    session.addModule('main', code)
    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '부모 클래스로 쓸 수 없습니다')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(
            result.error.message,
            '부모 클래스로 쓸 수 없습니다',
        )
        return
    }

    throw new Error('부모 클래스 오류가 발생해야 합니다.')
})

Deno.test('생성자: 인자 개수가 맞는 생성자가 없으면 오류가 난다', async () => {
    const code = `
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
    약속, __준비__ (이름, 나이)
        자신.이름 = 이름
        자신.나이 = 나이

나 = 새 사람(1, 2, 3)
`
    const session = new YaksokSession()
    session.addModule('main', code)
    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '__준비__')
        assertStringIncludes(allMessages, '인자')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(result.error.message, '__준비__')
        assertStringIncludes(result.error.message, '인자')
        return
    }

    throw new Error('생성자 인자 개수 불일치 오류가 발생해야 합니다.')
})

Deno.test(
    '생성자: 같은 클래스에서 같은 인자 개수 생성자는 모호성 오류가 난다',
    async () => {
        const code = `
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, __준비__ (별명)
        자신.이름 = 별명

나 = 새 사람("달빛")
`
        const session = new YaksokSession()
        session.addModule('main', code)
        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')

        if (result.reason === 'validation') {
            const allMessages = [...result.errors.values()]
                .flat()
                .map((e) => e.message)
                .join('\n')
            assertStringIncludes(allMessages, '__준비__')
            assertStringIncludes(allMessages, '모호')
            return
        }

        if (result.reason === 'error') {
            assertStringIncludes(result.error.message, '__준비__')
            assertStringIncludes(result.error.message, '모호')
            return
        }

        throw new Error('생성자 모호성 오류가 발생해야 합니다.')
    },
)

Deno.test('생성자 모호성은 중복 보고되지 않는다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, __준비__ (별명)
        자신.이름 = 별명

나 = 새 사람("달빛")
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')
    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 생성자 모호성 오류가 발생해야 합니다.')
    }

    const messages = [...result.errors.values()].flat().map((e) => e.message)
    const ambiguityCount = messages.filter((msg) => msg.includes('모호')).length
    assertEquals(ambiguityCount, 1)
})

Deno.test(
    '생성자: 인스턴스화 없이도 같은 인자 개수 중복은 검증 오류다',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, __준비__ (별명)
        자신.이름 = 별명
`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')
        if (result.reason !== 'validation') {
            throw new Error(
                '검증 단계에서 생성자 모호성 오류가 발생해야 합니다.',
            )
        }

        const messages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
        const ambiguityCount = messages.filter((msg) =>
            msg.includes('모호'),
        ).length
        assertEquals(ambiguityCount, 1)
    },
)

Deno.test('멤버 호출은 전역 함수로 폴백하지 않는다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
약속, (음료) 마시기
    "전역 " + 음료 반환하기

클래스, 사람
    약속, __준비__
        자신.이름 = "달이"

나 = 새 사람
나. "물" 마시기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '메서드')
        assertStringIncludes(allMessages, '마시기')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(result.error.message, '메서드')
        assertStringIncludes(result.error.message, '마시기')
        return
    }

    throw new Error('전역 함수 폴백 없이 메서드 탐색 오류가 발생해야 합니다.')
})

Deno.test('멤버 자동 호출도 전역 함수로 폴백하지 않는다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
약속, 인사
    "전역 인사" 반환하기

클래스, 사람
    약속, __준비__
        자신.이름 = "달이"

나 = 새 사람
나.인사 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation') {
        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '멤버')
        assertStringIncludes(allMessages, '인사')
        return
    }

    if (result.reason === 'error') {
        assertStringIncludes(result.error.message, '멤버')
        assertStringIncludes(result.error.message, '인사')
        return
    }

    throw new Error('전역 함수 폴백 없이 식별자 오류가 발생해야 합니다.')
})

Deno.test(
    '생성자 인식: __준비__ 접두 이름은 생성자로 오인되지 않는다',
    async () => {
        const outputs = await runAndCollect(`
클래스, T
    약속, __준비__도우미 (x)
        자신.x = x

o = 새 T
"ok" 보여주기
`)

        assertEquals(outputs[0], 'ok')
    },
)

Deno.test(
    '생성자 인식: __준비__로 시작하는 일반 메서드(인자 포함)는 생성자가 아니다',
    async () => {
        const outputs = await runAndCollect(`
클래스, T
    약속, __준비__ (x) 도우미
        자신.x = x

o = 새 T
"ok" 보여주기
`)

        assertEquals(outputs[0], 'ok')
    },
)

Deno.test('클래스: 같은 이름 재선언은 검증 오류가 난다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, 사람
    약속, 이름
        "첫번째" 반환하기

클래스, 사람
    약속, 이름
        "두번째" 반환하기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 클래스 재선언 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '이미 정의')
})

Deno.test(
    '인스턴스화: 클래스가 아닌 값은 validation 단계에서 검출된다',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
없는클래스 = 1
o = 새 없는클래스
`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')

        if (result.reason === 'validation') {
            const allMessages = [...result.errors.values()]
                .flat()
                .map((e) => e.message)
                .join('\n')
            assertStringIncludes(allMessages, '클래스가 아닙니다')
            return
        }

        throw new Error(
            '클래스 타입 오류가 validation 단계에서 발생해야 합니다.',
        )
    },
)

Deno.test('상위: 부모에 없는 멤버 호출은 오류가 난다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, 부모
    약속, 기존메서드
        "ok" 반환하기

클래스, 자식(부모)
    약속, 테스트
        상위.없는메서드

o = 새 자식
o.테스트
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason === 'validation' || result.reason === 'error') {
        const allMessages =
            result.reason === 'validation'
                ? [...result.errors.values()]
                      .flat()
                      .map((e) => e.message)
                      .join('\n')
                : result.error.message

        assertStringIncludes(allMessages, '없는메서드')
        assertStringIncludes(allMessages, '멤버')
        return
    }

    throw new Error('상위 멤버 오류가 발생해야 합니다.')
})

Deno.test('생성자 충돌: 같은 인자 개수면 자식 생성자가 우선된다', async () => {
    const outputs = await runAndCollect(`
클래스, 부모
    약속, __준비__ (값)
        자신.출처 = "부모"
        자신.값 = 값

클래스, 자식(부모)
    약속, __준비__ (값)
        자신.출처 = "자식"
        자신.값 = 값 + 1

o = 새 자식(10)
o.출처 보여주기
o.값 보여주기
`)

    assertEquals(outputs[0], '자식')
    assertEquals(outputs[1], '11')
})

Deno.test('멤버 접근 오류는 validation 단계에서 검출된다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, C
    값 = 1

o = 새 C
o.없는멤버 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 멤버 없음 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '없는멤버')
    assertStringIncludes(allMessages, '멤버')
})

Deno.test('클래스 멤버 대입도 variableSet 이벤트를 발생시킨다', async () => {
    const setEventNames: string[] = []
    const session = new YaksokSession({
        events: {
            variableSet: (event) => {
                setEventNames.push(event.name)
            },
        },
    })

    session.addModule(
        'main',
        `
클래스, C
    약속, 바꾸기
        자신.새값 = 42

o = 새 C
o.바꾸기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')
    if (result.reason === 'validation') {
        throw new Error('검증 오류가 발생하면 안 됩니다.')
    }
    if (result.reason === 'error') {
        throw result.error
    }

    assertEquals(setEventNames.includes('새값'), true)
})

Deno.test('클래스: 예약어 이름은 검증 오류가 난다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, 자신
    값 = 1
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 예약어 클래스명 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '이름으로 사용할 수 없어요')
})

Deno.test('클래스: 기존 변수 이름과 충돌하면 검증 오류가 난다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
값 = 1
클래스, 값
    약속, __준비__
        자신.x = 1
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 클래스명 충돌 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '이미 정의')
})

Deno.test('클래스: 기존 함수 이름과 충돌하면 검증 오류가 난다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
약속, 사람
    "함수" 반환하기

클래스, 사람
    값 = 1
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 클래스명 충돌 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '이미 정의')
})

Deno.test('멤버 접근 검증: 새 인스턴스 직접 타겟도 validation 단계에서 검출된다', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
클래스, C
    값 = 1

(새 C).없는멤버 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')
    if (!result) throw new Error('실행 결과가 없습니다.')

    if (result.reason !== 'validation') {
        throw new Error('검증 단계에서 멤버 없음 오류가 발생해야 합니다.')
    }

    const allMessages = [...result.errors.values()]
        .flat()
        .map((e) => e.message)
        .join('\n')
    assertStringIncludes(allMessages, '없는멤버')
    assertStringIncludes(allMessages, '멤버')
})

Deno.test(
    '멤버 접근 검증: 메서드 내부 지역변수는 멤버 후보로 취급하지 않는다',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
클래스, C
    약속, 설정
        임시 = 1

o = 새 C
o.임시 보여주기
`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')

        if (result.reason !== 'validation') {
            throw new Error('검증 단계에서 멤버 없음 오류가 발생해야 합니다.')
        }

        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '임시')
        assertStringIncludes(allMessages, '멤버')
    },
)

Deno.test(
    '멤버 접근 검증: 클래스 본문 조건문 내부 할당도 멤버 후보로 인식한다',
    async () => {
        const outputs = await runAndCollect(`
클래스, C
    만약 참 이면
        임시 = 1

o = 새 C
o.임시 보여주기
`)

        assertEquals(outputs[0], '1')
    },
)

Deno.test(
    '멤버 접근 검증: 클래스 이름이 변수로 가려져도 멤버 오류를 검출한다',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
클래스, C
    값 = 1

o = 새 C
C = 10
o.없는멤버 보여주기
`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')
        if (!result) throw new Error('실행 결과가 없습니다.')

        if (result.reason !== 'validation') {
            throw new Error('검증 단계에서 멤버 없음 오류가 발생해야 합니다.')
        }

        const allMessages = [...result.errors.values()]
            .flat()
            .map((e) => e.message)
            .join('\n')
        assertStringIncludes(allMessages, '없는멤버')
        assertStringIncludes(allMessages, '멤버')
    },
)
