import { YaksokSession } from "@dalbit-yaksok/core";

const session = new YaksokSession();
await session.addModule("main", `"달빛약속에 오신걸 환영합니다" 보여주기
약속, 키가 (키)cm이고 몸무게가 (몸무게)일 때 비만도
    잠깐 멈추기
    몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (170)cm이고 몸무게가 (70)일 때 비만도

비만도 보여주기`).run()

