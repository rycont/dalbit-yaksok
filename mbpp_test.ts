import { yaksok } from './core/mod.ts'

async function run(name: string, code: string) {
    console.log(`\n--- Test: ${name} ---`);
    try {
        await yaksok(code);
    } catch (e) {
        console.error(e);
    }
}

// 1. 사각형 넓이
await run("Rectangle Area", `
약속, (가로) (세로) 사각형 넓이 구하기
    가로 * 세로 반환하기

(10 20 사각형 넓이 구하기) 보여주기
`);

// 3. 소수 판별
await run("Prime Check", `
약속, (수) 소수인지 확인
    만약 수 < 2 이면
        "거짓" 반환하기
    
    i = 2
    반복 i * i <= 수 마다
        만약 수 % i == 0 이면
            "거짓" 반환하기
        i = i + 1
    "참" 반환하기

(13 소수인지 확인) 보여주기
`);

// 8. 암스트롱 수 (Class)
await run("Armstrong Number", `
클래스, 숫자분석기
    약속, __준비__ (값)
        자신.값 = 값

    약속, 암스트롱수인지 확인
        백 = 자신.값 // 100
        십 = (자신.값 % 100) // 10
        일 = 자신.값 % 10
        합계 = (백**3) + (십**3) + (일**3)
        만약 합계 == 자신.값 이면
            "참" 반환하기
        아니면
            "거짓" 반환하기

분석 = 새 숫자분석기(153)
분석.암스트롱수인지 확인 보여주기
`);
