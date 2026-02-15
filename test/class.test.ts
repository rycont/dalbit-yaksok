import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.201.0/testing/asserts.ts";
import { YaksokSession } from "../core/mod.ts";

async function runAndCollect(code: string): Promise<string[]> {
  const outputs: string[] = [];
  const session = new YaksokSession({
    stdout: (msg: string) => {
      outputs.push(msg);
    },
  });

  session.addModule("main", code);
  const results = await session.runModule("main");
  const result = results.get("main")!;
  if (result.reason === "error") throw result.error;
  if (result.reason === "validation") {
    const errMsgs: string[] = [];
    for (const [key, errs] of result.errors) {
      errMsgs.push(`${key}: ${errs.map((e) => e.message).join(", ")}`);
    }
    throw new Error("Validation failed: " + errMsgs.join("; "));
  }

  return outputs;
}

Deno.test("클래스 선언 및 인스턴스 생성", async () => {
  const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
        자신.나이 = 10

    약속, (음료) 마시기
        자신.이름 + "(이)가 " + 음료 + " 마심" 반환하기

나 = 새 사람("정한")
나.나이 보여주기
나. "물" 마시기 보여주기
`);

  assertEquals(outputs[0], "10");
  assertEquals(outputs[1], "정한(이)가 물 마심");
});

Deno.test("클래스 멤버 변수 수정", async () => {
  const outputs = await runAndCollect(`
클래스, 카운터
    값 = 0
    약속, 증가
        자신.값 = 자신.값 + 1

c = 새 카운터
c.값 보여주기
c. 증가
c.값 보여주기
`);

  assertEquals(outputs[0], "0");
  assertEquals(outputs[1], "1");
});

Deno.test("클래스 생성자 다중 인수", async () => {
  const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름, 나이)
        자신.이름 = 이름
        자신.나이 = 나이

나 = 새 사람("정한", 25)
나.이름 보여주기
나.나이 보여주기
`);

  assertEquals(outputs[0], "정한");
  assertEquals(outputs[1], "25");
});

Deno.test("생성자가 없으면 전달 인수를 무시하고 생성된다", async () => {
  const outputs = await runAndCollect(`
클래스, 빈클래스
    값 = 7

객체 = 새 빈클래스(1, 2, 3)
객체.값 보여주기
`);

  assertEquals(outputs[0], "7");
});

Deno.test("멤버 접근 시 무인자 메서드 자동 호출이 동작한다", async () => {
  const outputs = await runAndCollect(`
클래스, 인사기
    약속, 인사
        "안녕" 반환하기

g = 새 인사기
g.인사 보여주기
`);

  assertEquals(outputs[0], "안녕");
});

Deno.test("상속: 부모 메서드와 필드를 물려받는다", async () => {
  const outputs = await runAndCollect(`
클래스, 동물
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, 소개
        자신.이름 + " 동물" 반환하기

클래스, 강아지(동물)
    약속, 짖기
        자신.이름 + " 멍멍" 반환하기

d = 새 강아지("초코")
d.소개 보여주기
d.짖기 보여주기
`);

  assertEquals(outputs[0], "초코 동물");
  assertEquals(outputs[1], "초코 멍멍");
});

Deno.test("상속: 자식 메서드가 부모 메서드를 오버라이드한다", async () => {
  const outputs = await runAndCollect(`
클래스, 동물
    약속, __준비__ (이름)
        자신.이름 = 이름

    약속, 소개
        자신.이름 + " 동물" 반환하기

클래스, 강아지(동물)
    약속, 소개
        자신.이름 + " 강아지" 반환하기

d = 새 강아지("보리")
d.소개 보여주기
`);

  assertEquals(outputs[0], "보리 강아지");
});

Deno.test("상속: 생성자 오버로드는 인수 개수로 선택된다", async () => {
  const outputs = await runAndCollect(`
클래스, 사람
    약속, __준비__ (이름)
        자신.이름 = 이름
        자신.나이 = 0

클래스, 학생(사람)
    약속, __준비__ (이름, 나이)
        자신.이름 = 이름
        자신.나이 = 나이

a = 새 학생("하늘")
b = 새 학생("바다", 13)
a.나이 보여주기
b.나이 보여주기
`);

  assertEquals(outputs[0], "0");
  assertEquals(outputs[1], "13");
});

Deno.test("상속: 자식 메서드에서 부모 필드를 수정할 수 있다", async () => {
  const outputs = await runAndCollect(`
클래스, 부모
    점수 = 1

클래스, 자식(부모)
    약속, 증가
        자신.점수 = 자신.점수 + 1

c = 새 자식
c.증가
c.점수 보여주기
`);

  assertEquals(outputs[0], "2");
});

Deno.test("상속: 다단계 상속에서도 부모 체인이 유지된다", async () => {
  const outputs = await runAndCollect(`
클래스, 생명체
    약속, __준비__ (이름)
        자신.이름 = 이름

클래스, 동물(생명체)
    약속, 종류
        "동물" 반환하기

클래스, 강아지(동물)
    약속, 소리
        "멍멍" 반환하기

d = 새 강아지("달이")
d.이름 보여주기
d.종류 보여주기
d.소리 보여주기
`);

  assertEquals(outputs[0], "달이");
  assertEquals(outputs[1], "동물");
  assertEquals(outputs[2], "멍멍");
});

Deno.test("상속: 부모 클래스가 아니면 오류가 난다", async () => {
  const code = `
값 = 1
클래스, 자식(값)
    약속, __준비__
        자신.x = 1
`;
  const session = new YaksokSession();
  session.addModule("main", code);
  try {
    await session.runModule("main");
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    assertStringIncludes(error.message, "부모 클래스로 쓸 수 없습니다");
    return;
  }

  throw new Error("부모 클래스 오류가 발생해야 합니다.");
});
