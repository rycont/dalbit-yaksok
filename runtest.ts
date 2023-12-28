import { yaksok } from './index.ts'

let stderr = ''

yaksok(
    {
        main: `
보드_시리얼: "1032"

만약 @아두이노 모델명 = "Arduino Uno" 이면
    "아두이노 모델명이 맞습니다." 보여주기
    @아두이노 보드_시리얼 버전 보여주기
`,
        아두이노: `
약속 시리얼 "버전"
    만약 시리얼 = "1032" 이면
        결과: "1.0.0"
    아니면
        만약 시리얼 = "1033" 이면
            결과: "1.0.1"
        아니면
            결과: "UNKNOWN"

    "지민"/2

모델명: "Arduino Uno"
`,
    },
    {
        stderr: (str) => (stderr += str + '\n'),
    },
)

console.dir(JSON.stringify(stderr))
