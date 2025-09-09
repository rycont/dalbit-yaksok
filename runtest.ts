import { CodeFile } from "@dalbit-yaksok/core";

function run(code: string) {
    console.log(code);
    (new CodeFile(code, Symbol('asdf'))).parseOptimistically()
}

const target = `"달빛약속에 오신걸 환영합니다" 보여주기
약속, 키가 (키)cm이고 몸무게가 (몸무게)일 때 비만도
    몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (170)cm이고 몸무게가 (70)일 때 비만도

비만도 보여주기
`

for(let i = 0; i < target.length; i++) {
    await run(target.slice(0, i))
}
