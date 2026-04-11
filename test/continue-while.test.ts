import { assertEquals } from '@std/assert'
import { YaksokSession } from '@dalbit-yaksok/core'
import { StandardExtension } from '../exts/standard/mod.ts'

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

    const standard = new StandardExtension()
    await session.extend(standard)
    await session.setBaseContext(standard.manifest.module!['표준'])

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

Deno.test('에라토스테네스의 체 - 반복 [조건] 동안 활용', async () => {
    const code = `
최대 = 30
소수여부 = []
반복 0~최대 의 i 마다
    소수여부.(참) 추가하기
소수여부[0] = 거짓
소수여부[1] = 거짓
반복 2~최대 의 i 마다
    만약 소수여부[i] 이면
        j = i + i
        반복 j <= 최대 동안
            소수여부[j] = 거짓
            j = j + i
반복 2~최대 의 i 마다
    만약 소수여부[i] 이면
        i 보여주기
`
    const result = await run(code)
    assertEquals(result, '2\n3\n5\n7\n11\n13\n17\n19\n23\n29')
})

Deno.test('버블 정렬', async () => {
    const code = `
리스트 = [5, 3, 8, 1, 9, 2, 7]
크기 = 리스트.길이

n = 크기 - 1
반복 n 동안
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 리스트[i] > 리스트[i + 1] 이면
            임시 = 리스트[i]
            리스트[i] = 리스트[i + 1]
            리스트[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

리스트 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
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

Deno.test('버블 정렬 - 변수명 충돌 수정', async () => {
    // '길이'는 표준 라이브러리 함수명과 충돌 → '크기' 사용
    const code = `
리스트 = [5, 3, 8, 1, 9, 2, 7]
크기 = 리스트.길이

n = 크기 - 1
반복 n 동안
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 리스트[i] > 리스트[i + 1] 이면
            임시 = 리스트[i]
            리스트[i] = 리스트[i + 1]
            리스트[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

리스트 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
})

Deno.test('리스트 길이 단순 테스트', async () => {
    const code = `
리스트 = [1, 2, 3, 4, 5]
리스트.길이 보여주기
`
    const result = await run(code)
    assertEquals(result, '5')
})

Deno.test('리스트 길이 변수 할당', async () => {
    const code = `
리스트 = [1, 2, 3, 4, 5]
크기 = 리스트.길이
크기 보여주기
`
    const result = await run(code)
    assertEquals(result, '5')
})

Deno.test('리스트 길이 - 배열 변수명으로', async () => {
    const code = `
배열 = [1, 2, 3, 4, 5]
배열.길이 보여주기
`
    const result = await run(code)
    assertEquals(result, '5')
})

Deno.test('버블 정렬 - 배열/크기 변수명 사용', async () => {
    const code = `
배열 = [5, 3, 8, 1, 9, 2, 7]
크기 = 배열.길이

n = 크기 - 1
반복 n 동안
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 배열[i] > 배열[i + 1] 이면
            임시 = 배열[i]
            배열[i] = 배열[i + 1]
            배열[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
})

Deno.test('리스트 길이 - 점 표기법', async () => {
    const code = `
배열 = [1, 2, 3, 4, 5]
배열.길이 보여주기
`
    const result = await run(code)
    assertEquals(result, '5')
})

Deno.test('버블 정렬 - 점 표기법 길이', async () => {
    const code = `
배열 = [5, 3, 8, 1, 9, 2, 7]
n = 배열.길이 - 1

반복 n 동안
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 배열[i] > 배열[i + 1] 이면
            임시 = 배열[i]
            배열[i] = 배열[i + 1]
            배열[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
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

Deno.test('버블 정렬 - 반복 N 번 문법 사용', async () => {
    const code = `
배열 = [5, 3, 8, 1, 9, 2, 7]
n = 배열.길이 - 1

반복 n 번
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 배열[i] > 배열[i + 1] 이면
            임시 = 배열[i]
            배열[i] = 배열[i + 1]
            배열[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
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

Deno.test('버블 정렬 전체 - 로컬 검증', async () => {
    const code = `
배열 = [5, 3, 8, 1, 9, 2, 7]
n = 배열.길이 - 1

n 번 반복
    바뀜 = 거짓
    반복 0~(n - 1) 의 i 마다
        만약 배열[i] > 배열[i + 1] 이면
            임시 = 배열[i]
            배열[i] = 배열[i + 1]
            배열[i + 1] = 임시
            바뀜 = 참
    만약 !바뀜 이면
        반복 그만
    n = n - 1

배열 보여주기
`
    const result = await run(code)
    assertEquals(result, '[1, 2, 3, 5, 7, 8, 9]')
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

Deno.test('리스트 리터럴 임시변수로 추가하기', async () => {
    // [a, b] 리터럴을 직접 추가하기에 넣으면 오류 → 임시변수 사용
    const code = `
목록 = []
임시 = [1, 2]
목록.(임시) 추가하기
임시 = [3, 4]
목록.(임시) 추가하기
목록 보여주기
`
    const result = await run(code)
    assertEquals(result, '[[1, 2], [3, 4]]')
})

Deno.test('허프만 코딩 - ABRACADABRA', async () => {
    // Huffman coding requires: recursive functions, nested lists, range guards
    // 반환 문법: "값 반환하기" (postfix)
    // 함수 호출: "인자1 인자2 함수이름" (not C-style)
    // 리스트 리터럴 인자: 임시변수 사용
    const code = `
문자열 = "ABRACADABRA"

빈도목록 = []
반복 문자열 의 글자 마다
    찾음 = 거짓
    만약 빈도목록.길이 > 0 이면
        반복 0~(빈도목록.길이 - 1) 의 i 마다
            만약 빈도목록[i][1] == 글자 이면
                빈도목록[i][0] = 빈도목록[i][0] + 1
                찾음 = 참
    만약 !찾음 이면
        새항목 = [1, 글자]
        빈도목록.(새항목) 추가하기

노드들 = []
반복 0~(빈도목록.길이 - 1) 의 i 마다
    노드들.(빈도목록[i]) 추가하기

반복 노드들.길이 > 1 동안
    반복 0~(노드들.길이 - 2) 의 i 마다
        만약 노드들[i][0] > 노드들[i + 1][0] 이면
            임시 = 노드들[i]
            노드들[i] = 노드들[i + 1]
            노드들[i + 1] = 임시
    왼쪽 = 노드들[0]
    오른쪽 = 노드들[1]
    합산 = 왼쪽[0] + 오른쪽[0]
    합친노드 = [합산, 왼쪽, 오른쪽]
    새노드들 = []
    만약 노드들.길이 > 2 이면
        반복 2~(노드들.길이 - 1) 의 i 마다
            새노드들.(노드들[i]) 추가하기
    새노드들.(합친노드) 추가하기
    노드들 = 새노드들

결과 = []

약속, (노드) (코드) 코드생성
    만약 노드.길이 == 2 이면
        결과.(노드[1]) 추가하기
        결과.(코드) 추가하기
        반환하기
    노드[1] (코드 + "0") 코드생성
    노드[2] (코드 + "1") 코드생성

만약 노드들.길이 == 1 이면
    노드들[0] "" 코드생성

결과 보여주기
`
    const result = await run(code)
    assertEquals(result, '[A, 0, B, 100, R, 101, C, 110, D, 111]')
})

Deno.test('완전수 찾기 (6, 28)', async () => {
    const code = `
완전수목록 = []
수 = 1
반복 수 <= 30 동안
    약수합 = 0
    나누는수 = 1
    반복 나누는수 < 수 동안
        만약 수 % 나누는수 == 0 이면
            약수합 = 약수합 + 나누는수
        나누는수 = 나누는수 + 1
    만약 약수합 == 수 이면
        완전수목록.(수) 추가하기
    수 = 수 + 1

완전수목록 보여주기
`
    const result = await run(code)
    assertEquals(result, '[6, 28]')
})
