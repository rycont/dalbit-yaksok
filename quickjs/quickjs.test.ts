import {
    assert,
    assertEquals,
    assertInstanceOf,
    assertIsError,
    unreachable,
} from 'assert'
import { ListValue, StringValue, YaksokSession } from '../core/mod.ts'
import { NumberValue } from '../core/value/primitive.ts'
import { QuickJS, QuickJSInternalError } from './mod.ts'

Deno.test('Error in QuickJS', async () => {
    const session = new YaksokSession()
    await session.extend(new QuickJS())

    try {
        session.addModule(
            'main',
            `번역(QuickJS), 에러 발생
***
    throw new Error('QuickJS Error')
***

에러 발생
`,
        )

        await session.runModule('main')
        unreachable()
    } catch (error) {
        assertIsError(error, QuickJSInternalError)
    }
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

    const result = await session.runModule('main')
    const 숫자 = result.ranScope!.getVariable('숫자')
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

    const result = await session.runModule('main')
    const 숫자 = result.ranScope!.getVariable('숫자')
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

    const { ranScope } = await session.runModule('main')

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
