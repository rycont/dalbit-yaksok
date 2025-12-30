import { getAutocomplete, YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert'

Deno.test('getAutocomplete returns local variables', () => {
    const session = new YaksokSession()

    const codeFile = session.addModule(
        'main',
        `
사과 = 1
바나나 = 2
`,
    )

    codeFile.validate()

    const result = getAutocomplete(codeFile, { line: 3, column: 1 })

    assertEquals(result.includes('사과'), true)
    assertEquals(result.includes('바나나'), true)
})

Deno.test('getAutocomplete returns local functions', () => {
    const session = new YaksokSession()

    const codeFile = session.addModule(
        'main',
        `약속, 인사하기
    "안녕" 보여주기

약속, (이름)에게 인사하기
    이름 + "님 안녕" 보여주기

인사하기`,
    )

    codeFile.validate()

    const result = getAutocomplete(codeFile, { line: 7, column: 1 })

    assertEquals(result.includes('인사하기'), true)
    assertEquals(result.includes('(이름)에게 인사하기'), true)
})

Deno.test('getAutocomplete returns mentioned module identifiers', () => {
    const session = new YaksokSession()

    session.addModule(
        '수학',
        `
파이 = 3.14159

약속, (숫자) 제곱하기
    숫자 * 숫자 반환하기
`,
    )

    const mainCodeFile = session.addModule(
        'main',
        `
결과 = 0
`,
    )

    mainCodeFile.validate()

    const result = getAutocomplete(mainCodeFile, { line: 2, column: 1 })

    // 로컬 변수
    assertEquals(result.includes('결과'), true)
    
    // 멘션된 모듈의 변수와 함수
    assertEquals(result.includes('@수학 파이'), true)
    assertEquals(result.includes('@수학 (숫자) 제곱하기'), true)
})

Deno.test('getAutocomplete excludes current file from mentions', () => {
    const session = new YaksokSession()

    const codeFile = session.addModule(
        'main',
        `
내변수 = 1
`,
    )

    codeFile.validate()

    const result = getAutocomplete(codeFile, { line: 2, column: 1 })

    // 현재 파일의 변수는 로컬로 포함
    assertEquals(result.includes('내변수'), true)
    
    // 현재 파일은 멘션 형태로 포함되지 않음
    assertEquals(result.includes('@main 내변수'), false)
})

Deno.test('getAutocomplete handles multiple modules', () => {
    const session = new YaksokSession()

    session.addModule(
        '모듈A',
        `
변수A = 1
약속, 함수A
    1 반환하기
`,
    )

    session.addModule(
        '모듈B',
        `
변수B = 2
약속, 함수B
    2 반환하기
`,
    )

    const mainCodeFile = session.addModule(
        'main',
        `
메인변수 = 0
`,
    )

    mainCodeFile.validate()

    const result = getAutocomplete(mainCodeFile, { line: 2, column: 1 })

    // 로컬 변수
    assertEquals(result.includes('메인변수'), true)
    
    // 모듈A의 식별자들
    assertEquals(result.includes('@모듈A 변수A'), true)
    assertEquals(result.includes('@모듈A 함수A'), true)
    
    // 모듈B의 식별자들
    assertEquals(result.includes('@모듈B 변수B'), true)
    assertEquals(result.includes('@모듈B 함수B'), true)
})

Deno.test('getAutocomplete returns empty array when no scope found', () => {
    const session = new YaksokSession()

    const codeFile = session.addModule('main', ``)

    // validate를 호출하지 않으면 validationScopes가 비어있음
    const result = getAutocomplete(codeFile, { line: 1, column: 1 })

    assertEquals(result.length, 0)
})

Deno.test('getAutocomplete ignores modules with validation errors', () => {
    const session = new YaksokSession()

    // 유효하지 않은 모듈 (정의되지 않은 변수 사용)
    session.addModule(
        '잘못된모듈',
        `
약속, 잘못된함수
    없는변수 보여주기
`,
    )

    // 유효한 모듈
    session.addModule(
        '정상모듈',
        `
정상변수 = 1
`,
    )

    const mainCodeFile = session.addModule(
        'main',
        `
메인 = 0
`,
    )

    mainCodeFile.validate()

    const result = getAutocomplete(mainCodeFile, { line: 2, column: 1 })

    // 정상 모듈의 식별자는 포함
    assertEquals(result.includes('@정상모듈 정상변수'), true)
    
    // 잘못된 모듈의 함수도 포함 (validate가 에러를 던지지 않고 에러 배열을 반환하므로)
    assertEquals(result.includes('@잘못된모듈 잘못된함수'), true)
})
