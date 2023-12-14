import { assertEquals, assertIsError, unreachable } from 'assert'
import { parse } from '../prepare/parse/index.ts'

import { run } from '../runtime/run.ts'
import { tokenize } from '../prepare/tokenize/index.ts'
import { YaksokError } from '../errors.ts'

Deno.test('Function Josa Variants', () => {
    const code = `
약속 음식 "을/를" 누구 "와/과 먹기"
    결과: "맛있는 " + 음식 + ", 결국 " + 누구 + "에게 갔습니다.."
    
테스트1: "치킨"을 "현재"와 먹기
테스트2: "피자"를 "현재"와 먹기
테스트3: "햄버거"을 "수현"과 먹기
테스트4: "햄버거"를 "수현"과 먹기
`

    const result = run(parse(tokenize(code)))

    assertEquals(
        result.getVariable('테스트1').value,
        '맛있는 치킨, 결국 현재에게 갔습니다..',
    )
    assertEquals(
        result.getVariable('테스트2').value,
        '맛있는 피자, 결국 현재에게 갔습니다..',
    )
    assertEquals(
        result.getVariable('테스트3').value,
        '맛있는 햄버거, 결국 수현에게 갔습니다..',
    )
    assertEquals(
        result.getVariable('테스트4').value,
        '맛있는 햄버거, 결국 수현에게 갔습니다..',
    )
})

Deno.test('Broken function declaration', () => {
    const code = `
약속 음식 10개를 야무지게 먹기
    결과: "맛있는 " + 음식 + ", 결국 " + 누구 + "에게 갔습니다.."
`

    try {
        run(parse(tokenize(code)))
        unreachable()
    } catch (e) {
        assertIsError(e, YaksokError)
        assertEquals(e.name, 'UNEXPECTED_TOKEN')
    }
})
