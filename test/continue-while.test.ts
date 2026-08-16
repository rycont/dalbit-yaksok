import { assertEquals } from '@std/assert'
import { YaksokSession } from '@dalbit-yaksok/core'

async function run(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
        stderr(value) {
            console.error(value)
        },
    })

    session.addModule('main', code)
    await session.runModule('main')

    return output.trim()
}

Deno.test('다음 반복 - 범위 반복에서 특정 값 건너뛰기', async () => {
    // i == 3 일 때 건너뛰어서 1,2,4,5 출력
    const code = `
반복 1~5 의 i 마다
    만약 i == 3 이면
        다음 반복
    i 보여주기
`
    const result = await run(code)
    assertEquals(result, '1\n2\n4\n5')
})

Deno.test('반복 [조건] 동안 - while 루프', async () => {
    const code = `
i = 1
반복 i <= 5 동안
    i 보여주기
    i = i + 1
`
    const result = await run(code)
    assertEquals(result, '1\n2\n3\n4\n5')
})

Deno.test('논리 부정 - 아니다 문법', async () => {
    const code = `
바뀜 = 거짓
만약 바뀜 아니다 이면
    "부정 성공" 보여주기
`
    const result = await run(code)
    assertEquals(result, '부정 성공')
})

Deno.test('논리 부정 - ! 문법', async () => {
    const code = `
바뀜 = 거짓
만약 !바뀜 이면
    "부정 성공" 보여주기
`
    const result = await run(code)
    assertEquals(result, '부정 성공')
})

Deno.test('배열 인덱스 할당 동작 확인', async () => {
    const code = `
배열 = [1, 2, 3]
배열[0] = 99
배열[1] = 88
배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[99, 88, 3]')
})

Deno.test('배열 요소 스왑 확인', async () => {
    const code = `
배열 = [3, 1]
임시 = 배열[0]
배열[0] = 배열[1]
배열[1] = 임시
배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 3]')
})

Deno.test('버블 정렬 핵심 1회 패스', async () => {
    const code = `
배열 = [5, 3, 8, 1]
반복 0~2 의 i 마다
    만약 배열[i] > 배열[i + 1] 이면
        임시 = 배열[i]
        배열[i] = 배열[i + 1]
        배열[i + 1] = 임시
배열 보여주기
`
    const result = await run(code)
    // After one pass, largest element (8) should bubble to end
    assertEquals(result, '[3, 5, 1, 8]')
})

Deno.test('내부 루프에서 외부 변수 수정', async () => {
    // 내부 루프에서 '바뀜' 변수를 수정하면 외부 루프에서 보여야 한다
    const code = `
바뀜 = 거짓
반복 1~3 의 i 마다
    바뀜 = 참
바뀜 보여주기
`
    const result = await run(code)
    assertEquals(result, '참')
})

Deno.test('반복 번 - 중간에 조건 감지', async () => {
    // 반복 n 번 중간에 !바뀜 감지 → 반복 그만 동작 확인
    const code = `
n = 3
반복 n 번
    바뀜 = 거짓
    반복 0~1 의 i 마다
        바뀜 = 참
    만약 !바뀜 이면
        "break 발생" 보여주기
        반복 그만
    "n=" 보여주기
    n 보여주기
`
    const result = await run(code)
    // 바뀜이 항상 참이 되므로 break 없이 n이 3번 출력되어야 함
    assertEquals(result, 'n=\n3\nn=\n3\nn=\n3')
})

Deno.test('n번 반복 + 내부 루프에서 배열[i+1] 접근', async () => {
    const code = `
배열 = [5, 3, 8]
n = 2

n 번 반복
    반복 0~(n - 1) 의 i 마다
        배열[i] 보여주기
        배열[i + 1] 보여주기
`
    const result = await run(code)
    // 첫 반복: i=0: 배열[0]=5, 배열[1]=3, i=1: 배열[1]=3, 배열[2]=8
    // 두 번째 반복: 같은 것
    assertEquals(result, '5\n3\n3\n8\n5\n3\n3\n8')
})

Deno.test('나머지 연산자 % 확인', async () => {
    const code = `
10 % 3 보여주기
6 % 2 보여주기
7 % 3 보여주기
`
    const result = await run(code)
    assertEquals(result, '1\n0\n1')
})

Deno.test('재귀 함수 - 팩토리얼', async () => {
    // 약속 문법으로 재귀 함수 선언 + 호출 검증
    // 반환하기는 후위 형식: "값 반환하기"
    const code = `
약속, (n) 팩토리얼
    만약 n <= 1 이면
        1 반환하기
    n * ((n - 1) 팩토리얼) 반환하기

5 팩토리얼 보여주기
`
    const result = await run(code)
    assertEquals(result, '120')
})

Deno.test('재귀 함수 - 인자 2개 (거듭제곱)', async () => {
    // 인자 2개짜리 재귀 함수 호출 문법 검증
    const code = `
약속, (밑) (지수) 거듭제곱
    만약 지수 == 0 이면
        1 반환하기
    밑 * (밑 (지수 - 1) 거듭제곱) 반환하기

2 3 거듭제곱 보여주기
3 4 거듭제곱 보여주기
`
    const result = await run(code)
    assertEquals(result, '8\n81')
})
