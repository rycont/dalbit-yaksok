import { assertEquals } from "@std/assert";
import { YaksokSession } from "../core/mod.ts";

Deno.test("정의된 식별자를 활용해 토큰을 분리한다", async () => {
  let output = "";

  const session = new YaksokSession({
    stdout(value) {
      output += value + "\n";
    },
  });

  session.addModule(
    "main",
    `약속, (물건)을 구매하기
    물건 + "을 샀어요" 보여주기

먹을_과일 = '사과'
먹을_과일을 구매하기
`,
  );

  await session.runModule("main");

  assertEquals(output, "사과을 샀어요\n");
});

Deno.test("복수 인자와 분기형 조사를 가진 약속 호출에서도 토큰을 분리한다", async () => {
  let output = "";

  const session = new YaksokSession({
    stdout(value) {
      output += value + "\n";
    },
  });

  session.addModule(
    "main",
    `약속, (물건)을/를 (장소)에서 (사람)와/과 나누기
    사람 + "와 함께 " + 장소 + "에서 " + 물건 + "을 나눴어요" 보여주기

나눌_물건 = "귤"
모일_장소 = "도서관"
첫번째_사람 = "민수"
두번째_사람 = "아리"

(나눌_물건)을 모일_장소에서 첫번째_사람과 나누기
나눌_물건 = "바나나"
나눌_물건를 모일_장소에서 (두번째_사람)와 나누기
`,
  );

  await session.runModule("main");

  assertEquals(
    output,
    [
      "민수와 함께 도서관에서 귤을 나눴어요",
      "아리와 함께 도서관에서 바나나을 나눴어요",
    ].join("\n") + "\n",
  );
});
