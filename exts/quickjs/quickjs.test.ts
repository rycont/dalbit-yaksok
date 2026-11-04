import {
    BooleanValue,
    ErrorOccurredWhileRunningFFIExecution,
    ListValue,
    NumberValue,
    StringValue,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { quickJS, QuickJSInternalError } from '@dalbit-yaksok/quickjs'

import { test, expect, assert } from 'vite-plus/test'

test('Error in QuickJS', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    await session.extend(await quickJS())

    const codeFile = session.addModule(
        'main',
        `번역(QuickJS), 에러 발생
***
    throw new Error('QuickJS Error')
***

에러 발생
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], ErrorOccurredWhileRunningFFIExecution)
    expect(errors[0].child).toBeInstanceOf(QuickJSInternalError)
})

test('QuickJS passed number', async () => {
    const session = new YaksokSession()
    await session.extend(await quickJS())

    const scope = await session
        .addModule(
            'main',
            `
번역(QuickJS), 랜덤 수
***
    return 20
***

숫자 = 랜덤 수`,
        )
        .run()

    const 숫자 = scope.getVariable('숫자')
    expect.assert.instanceOf(숫자, NumberValue)
    expect(숫자.value).toBe(20)
    expect(숫자.toPrint()).toBe('20')
})

test('QuickJS passed Array<number>', async () => {
    const session = new YaksokSession()
    await session.extend(await quickJS())

    const scope = await session
        .addModule(
            'main',
            `
번역(QuickJS), 랜덤 수
***
    return [20, 30]
***

숫자 = 랜덤 수
`,
        )
        .run()

    const 숫자 = scope.getVariable('숫자')
    expect.assert.instanceOf(숫자, ListValue)
    expect(숫자.toPrint()).toBe('[20, 30]')
})

test('JavaScript bridge function passed object', async () => {
    const session = new YaksokSession()
    await session.extend(
        await quickJS({
            student: () => ({
                name: '홍길동',
                age: 20,
            }),
            name: () => '홍길동',
            age: () => 20,
            allNames: () => ['홍길동', '임꺽정', '김철수'],
        }),
    )

    const ranScope = await session
        .addModule(
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
        .run()

    assert(ranScope, 'ranScope should not be null')

    const 학생 = ranScope.getVariable('학생') as StringValue
    const 이름 = ranScope.getVariable('이름') as StringValue
    const 나이 = ranScope.getVariable('나이') as NumberValue
    const 더한_결과 = ranScope.getVariable('더한_결과') as NumberValue
    const 모든_이름 = ranScope.getVariable('모든_이름') as ListValue

    expect.assert.instanceOf(학생, StringValue)
    expect.assert.instanceOf(이름, StringValue)
    expect.assert.instanceOf(나이, NumberValue)
    expect.assert.instanceOf(더한_결과, NumberValue)
    expect.assert.instanceOf(모든_이름, ListValue)

    expect(학생.value).toBe('홍길동')
    expect(이름.value).toBe('홍길동')
    expect(나이.value).toBe(20)
    expect(더한_결과.value).toBe(30)

    expect(모든_이름.toPrint()).toBe('[홍길동, 임꺽정, 김철수]')
})

test('Yaksok Passed List<string>', async () => {
    let buffer = ''
    const session = new YaksokSession({
        stdout(message: string) {
            buffer += message + '\n'
        },
    })
    await session.extend(await quickJS())

    const scope = await session
        .addModule(
            'main',
            `
번역(QuickJS), (리스트) 중 최대값
***
    return Math.max(...리스트)
***

번역(QuickJS), (리스트)에서 가장 큰 값 제거하기
***
    const n = 리스트.indexOf(Math.max(...리스트))
    return [...리스트.slice(0, n), ...리스트.slice(n + 1)]
***

내_점수 = [80, 90, 100]
내_점수 중 최대값 보여주기

내_점수 = 내_점수 에서 가장 큰 값 제거하기
내_점수 보여주기
내_점수 중 최대값 보여주기
`,
        )
        .run()

    const 내_점수 = scope.getVariable('내_점수')
    expect.assert.instanceOf(내_점수, ListValue)
    expect(내_점수.toPrint()).toBe('[80, 90]')

    expect(buffer).toBe('100\n[80, 90]\n90\n')
})

test('QuickJS Passed List<string> - 빈 리스트', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 길이
***
    return 리스트.length
***

리스트 = []
리스트 길이 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('0')
})

test('QuickJS Passed List<string> - 중복 값', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 합치기
***
    return 리스트.join(",")
***

리스트 = ["a", "a", "b"]
리스트 합치기 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('a,a,b')
})

test('QuickJS Passed List<string> - 특수문자/이모지/빈문자', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 합치기
***
    return 리스트.join("|")
***

리스트 = ["😀", "a!@#", "한글", ""]
리스트 합치기 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('😀|a!@#|한글|')
})

test('QuickJS Passed List<string> - 영문 대문자 변환', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 대문자
***
    return 리스트.map(x => x.toUpperCase()).join("")
***

리스트 = ["a", "b", "c"]
리스트 대문자 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('ABC')
})

test('QuickJS Passed List<string> - 공백/탭/개행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 길이합치기
***
    return 리스트.map(x => x.length).join(",")
***

리스트 = [" ", "   ", "\\t", "\\n"]
리스트 길이합치기 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('1,3,1,1')
})

test('QuickJS Passed List<string> - 한글 포함 여부', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 포함
***
    return 리스트.includes("나") ? "Y" : "N"
***

리스트 = ["가", "나", "다"]
리스트 포함 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('Y')
})

test('QuickJS Passed List<string> - 숫자 문자열 합치기', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) 합치기
***
    return 리스트.reduce((a, b) => a + b, "")
***

리스트 = ["1", "2", "3"]
리스트 합치기 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('123')
})

test('QuickJS Passed List<string> - 2차원 리스트 flat', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout: (str: string) => {
            output += str
        },
    })
    await session.extend(await quickJS())
    session.addModule(
        'main',
        `번역(QuickJS), (리스트) flat
***
    return 리스트.flat().join("")
***

A = ["x", "y"]
B = [A, ["z", "r"]]
B flat 보여주기`,
    )
    await session.runModules(['main'])
    expect(output).toBe('xyzr')
})

test('QuickJS passed boolean', async () => {
    const session = new YaksokSession()
    await session.extend(await quickJS())

    const scope = await session
        .addModule(
            'main',
            `
번역(QuickJS), (par)에 (target)이 포함
***
    return par.includes(target)
***

결과 = "안녕하세요"에 "안녕"이 포함
결과 보여주기
`,
        )
        .run()

    const 결과 = scope.getVariable('결과')
    expect.assert.instanceOf(결과, BooleanValue)
    expect(결과.value).toBe(true)
    expect(결과.toPrint()).toBe('참')
})
