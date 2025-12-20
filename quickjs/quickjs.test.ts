import { assert, assertEquals, assertInstanceOf, assertIsError } from '@std/assert'
import {
    ErrorOccurredWhileRunningFFIExecution,
    ListValue,
    NumberValue,
    StringValue,
    YaksokSession,
} from '../core/mod.ts'
import { QuickJS, QuickJSInternalError } from './mod.ts'

Deno.test('Error in QuickJS', async () => {
    const session = new YaksokSession()
    await session.extend(new QuickJS())

    session.addModule(
        'main',
        `번역(QuickJS), 에러 발생
***
    throw new Error('QuickJS Error')
***

에러 발생
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!
    assert(
        result.reason === 'error',
        `Test should have failed, but it finished with reason: ${result.reason}`,
    )
    assertIsError(result.error, ErrorOccurredWhileRunningFFIExecution)
    assertIsError(result.error.child, QuickJSInternalError)
})

Deno.test('QuickJS passed number', async () => {
    const session = new YaksokSession()
    await session.extend(new QuickJS())

    session.addModule(
        'main',
        `
번역(QuickJS), 랜덤 수
***
    return 20
***

숫자 = 랜덤 수`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'finish')
    const 숫자 = result.codeFile!.ranScope!.getVariable('숫자')
    assertInstanceOf(숫자, NumberValue)
    assertEquals(숫자.value, 20)
    assertEquals(숫자.toPrint(), '20')
})

Deno.test('QuickJS passed Array<number>', async () => {
    const session = new YaksokSession()
    await session.extend(new QuickJS())

    session.addModule(
        'main',
        `
번역(QuickJS), 랜덤 수
***
    return [20, 30]
***

숫자 = 랜덤 수
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'finish')
    const 숫자 = result.codeFile!.ranScope!.getVariable('숫자')
    assertInstanceOf(숫자, ListValue)
    assertEquals(숫자.toPrint(), '[20, 30]')
})

Deno.test('JavaScript bridge function passed object', async () => {
    const quickJS = new QuickJS({
        student: () => ({
            name: '홍길동',
            age: 20,
        }),
        name: () => '홍길동',
        age: () => 20,
        allNames: () => ['홍길동', '임꺽정', '김철수'],
    })

    const session = new YaksokSession()
    await session.extend(quickJS)

    session.addModule(
        'main',
        `
번역(QuickJS), 학생 정보
***
    return student().name
***

번역(QuickJS), 이름 가져오기
***
    return name()
***

번역(QuickJS), 나이 가져오기
***
    return age()
***

학생 = 학생 정보
이름 = 이름 가져오기
나이 = 나이 가져오기

번역(QuickJS), (A)와 (B)를 더하기
***
    return A + B
***

번역(QuickJS), 모든 이름
***
    return allNames()
***

더한_결과 = (10)와 (20)를 더하기

모든_이름 = 모든 이름
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'finish')
    const ranScope = result.codeFile!.ranScope

    assert(ranScope, 'ranScope should not be null')

    const 학생 = ranScope.getVariable('학생') as StringValue
    const 이름 = ranScope.getVariable('이름') as StringValue
    const 나이 = ranScope.getVariable('나이') as NumberValue
    const 더한_결과 = ranScope.getVariable('더한_결과') as NumberValue
    const 모든_이름 = ranScope.getVariable('모든_이름') as ListValue

    assertInstanceOf(학생, StringValue)
    assertInstanceOf(이름, StringValue)
    assertInstanceOf(나이, NumberValue)
    assertInstanceOf(더한_결과, NumberValue)
    assertInstanceOf(모든_이름, ListValue)

    assertEquals(학생.value, '홍길동')
    assertEquals(이름.value, '홍길동')
    assertEquals(나이.value, 20)
    assertEquals(더한_결과.value, 30)

    assertEquals(모든_이름.toPrint(), '[홍길동, 임꺽정, 김철수]')
})

Deno.test('Yaksok Passed List<string>', async () => {
    let buffer = ''
    const session = new YaksokSession({
        stdout(message) {
            buffer += message + '\n'
        },
    })
    await session.extend(new QuickJS())

    session.addModule(
        'main',
        `
번역(QuickJS), (배열) 중 최대값
***
    return Math.max(...배열)
***

번역(QuickJS), (배열)에서 가장 큰 값 제거하기
***
    const n = 배열.indexOf(Math.max(...배열))
    return [...배열.slice(0, n), ...배열.slice(n + 1)]
***

내_점수 = [80, 90, 100]
내_점수 중 최대값 보여주기

내_점수 = 내_점수 에서 가장 큰 값 제거하기
내_점수 보여주기
내_점수 중 최대값 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(result.reason === 'finish')
    const 내_점수 = result.codeFile.ranScope!.getVariable('내_점수')
    assertInstanceOf(내_점수, ListValue)
    assertEquals(내_점수.toPrint(), '[80, 90]')

    assertEquals(buffer, '100\n[80, 90]\n90\n')
})

Deno.test('QuickJS Passed List<string> - 빈 배열', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 길이
***
    return 배열.length
***

배열 = []
배열 길이 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, '0')
})

Deno.test('QuickJS Passed List<string> - 중복 값', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 합치기
***
    return 배열.join(",")
***

배열 = ["a", "a", "b"]
배열 합치기 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, 'a,a,b')
})

Deno.test('QuickJS Passed List<string> - 특수문자/이모지/빈문자', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 합치기
***
    return 배열.join("|")
***

배열 = ["😀", "a!@#", "한글", ""]
배열 합치기 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, '😀|a!@#|한글|')
})

Deno.test('QuickJS Passed List<string> - 영문 대문자 변환', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 대문자
***
    return 배열.map(x => x.toUpperCase()).join("")
***

배열 = ["a", "b", "c"]
배열 대문자 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, 'ABC')
})

Deno.test('QuickJS Passed List<string> - 공백/탭/개행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 길이합치기
***
    return 배열.map(x => x.length).join(",")
***

배열 = [" ", "   ", "\\t", "\\n"]
배열 길이합치기 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, '1,3,1,1')
})

Deno.test('QuickJS Passed List<string> - 한글 포함 여부', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 포함
***
    return 배열.includes("나") ? "Y" : "N"
***

배열 = ["가", "나", "다"]
배열 포함 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, 'Y')
})

Deno.test('QuickJS Passed List<string> - 숫자 문자열 합치기', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) 합치기
***
    return 배열.reduce((a, b) => a + b, "")
***

배열 = ["1", "2", "3"]
배열 합치기 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, '123')
})

Deno.test('QuickJS Passed List<string> - 2차원 배열 flat', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str) => {
            output += str
        },
    })
    await session.extend(new QuickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (배열) flat
***
    return 배열.flat().join("")
***

A = ["x", "y"]
B = [A, ["z", "r"]]
B flat 보여주기`,
    )
    await session.runModule('main')
    assertEquals(output, 'xyzr')
})
