import { assertAlmostEquals, assertEquals, assertRejects } from "@std/assert";
import { YaksokSession } from "../core/mod.ts";
import { StatisticsExtension } from "../statistics/mod.ts";

async function runStats(code: string): Promise<string> {
  let output = "";
  const session = new YaksokSession({
    stdout(value) {
      output += value + "\n";
    },
  });
  await session.extend(new StatisticsExtension());
  session.addModule("main", code);
  await session.runModule("main");
  return output.trim();
}

// === 합계 ===

Deno.test("합계", async () => {
  const output = await runStats(`(@통계 [1, 2, 3, 4, 5]의 합계) 보여주기`);
  assertEquals(output, "15");
});

Deno.test("합계 - 총합 표기", async () => {
  const output = await runStats(`(@통계 [10, 20, 30]의 총합) 보여주기`);
  assertEquals(output, "60");
});

Deno.test("합계 - 빈 목록", async () => {
  await assertRejects(
    () => runStats(`(@통계 []의 합계) 보여주기`),
    Error,
    "목록이 비어있습니다",
  );
});

// === 평균 ===

Deno.test("평균", async () => {
  const output = await runStats(`(@통계 [2, 4, 6, 8, 10]의 평균) 보여주기`);
  assertEquals(output, "6");
});

Deno.test("평균 - 소수점", async () => {
  const output = await runStats(`(@통계 [1, 2, 3]의 평균) 보여주기`);
  assertEquals(output, "2");
});

// === 범위 ===

Deno.test("범위", async () => {
  const output = await runStats(`(@통계 [3, 7, 1, 9, 4]의 범위) 보여주기`);
  assertEquals(output, "8");
});

// === 중앙값 ===

Deno.test("중앙값 - 홀수 개", async () => {
  const output = await runStats(`(@통계 [1, 3, 5, 7, 9]의 중앙값) 보여주기`);
  assertEquals(output, "5");
});

Deno.test("중앙값 - 짝수 개", async () => {
  const output = await runStats(`(@통계 [1, 2, 3, 4]의 중앙값) 보여주기`);
  assertEquals(output, "2.5");
});

Deno.test("중앙값 - 정렬되지 않은 데이터", async () => {
  const output = await runStats(`(@통계 [9, 1, 5, 3, 7]의 중앙값) 보여주기`);
  assertEquals(output, "5");
});

// === 최빈값 ===

Deno.test("최빈값", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 2, 3, 3, 3, 4]의 최빈값) 보여주기`,
  );
  assertEquals(output, "3");
});

Deno.test("최빈값 - 없음", async () => {
  await assertRejects(
    () => runStats(`(@통계 [1, 2, 3, 4]의 최빈값) 보여주기`),
    Error,
    "최빈값이 없습니다",
  );
});

// === 최댓값 ===

Deno.test("최댓값", async () => {
  const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최댓값) 보여주기`);
  assertEquals(output, "9");
});

Deno.test("최대값 - 다른 표기", async () => {
  const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최대값) 보여주기`);
  assertEquals(output, "9");
});

// === 최솟값 ===

Deno.test("최솟값", async () => {
  const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최솟값) 보여주기`);
  assertEquals(output, "1");
});

Deno.test("최소값 - 다른 표기", async () => {
  const output = await runStats(`(@통계 [1, 5, 3, 9, 2]의 최소값) 보여주기`);
  assertEquals(output, "1");
});

// === 분산 ===

Deno.test("분산", async () => {
  const output = await runStats(
    `(@통계 [2, 4, 4, 4, 5, 5, 7, 9]의 분산) 보여주기`,
  );
  assertEquals(output, "4");
});

// === 표준편차 ===

Deno.test("표준편차", async () => {
  const output = await runStats(
    `(@통계 [2, 4, 4, 4, 5, 5, 7, 9]의 표준편차) 보여주기`,
  );
  assertEquals(output, "2");
});

// === 사분위수 ===

Deno.test("사분위수", async () => {
  const output = await runStats(`
데이터 = [1, 2, 3, 4, 5, 6, 7]
결과 = @통계 (데이터)의 사분위수
결과 보여주기
`);
  assertEquals(output, "[2, 4, 6]");
});

// === 왜도 ===

Deno.test("왜도 - 대칭 분포", async () => {
  const output = await runStats(`(@통계 [1, 2, 3, 4, 5]의 왜도) 보여주기`);
  const value = parseFloat(output);
  assertAlmostEquals(value, 0, 0.0001);
});

// === 첨도 ===

Deno.test("첨도 - 정규분포에 가까운 경우", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 3, 4, 5]의 첨도) 보여주기`,
  );
  const value = parseFloat(output);
  // 정규분포의 초과 첨도는 0에 가까움
  assertAlmostEquals(value, -1.3, 0.1);
});

// === 공분산 ===

Deno.test("공분산 - 양의 상관", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 3, 4, 5]와 [2, 4, 6, 8, 10]의 공분산) 보여주기`,
  );
  assertEquals(output, "4");
});

Deno.test("공분산 - 음의 상관", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 3, 4, 5]과 [10, 8, 6, 4, 2]의 공분산) 보여주기`,
  );
  assertEquals(output, "-4");
});

Deno.test("공분산 - 길이 불일치", async () => {
  await assertRejects(
    () => runStats(`(@통계 [1, 2, 3]와 [1, 2]의 공분산) 보여주기`),
    Error,
    "두 목록의 길이가 같아야 합니다",
  );
});

// === 상관계수 ===

Deno.test("상관계수 - 완전 양의 상관", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 3, 4, 5]와 [2, 4, 6, 8, 10]의 상관계수) 보여주기`,
  );
  const value = parseFloat(output);
  assertAlmostEquals(value, 1, 0.0001);
});

Deno.test("상관계수 - 완전 음의 상관", async () => {
  const output = await runStats(
    `(@통계 [1, 2, 3, 4, 5]과 [10, 8, 6, 4, 2]의 상관계수) 보여주기`,
  );
  const value = parseFloat(output);
  assertAlmostEquals(value, -1, 0.0001);
});

// === 변수를 이용한 통계 ===

Deno.test("변수를 이용한 통계 연산", async () => {
  const output = await runStats(`
데이터 = [10, 20, 30, 40, 50]
합 = @통계 (데이터)의 합계
평균값 = @통계 (데이터)의 평균
합 보여주기
평균값 보여주기
`);
  assertEquals(output, "150\n30");
});

// === 복합 연산 ===

Deno.test("복합 연산 - 표준화", async () => {
  const output = await runStats(`
데이터 = [2, 4, 4, 4, 5, 5, 7, 9]
평균값 = @통계 (데이터)의 평균
표준편차값 = @통계 (데이터)의 표준편차
정규화 = (7 - 평균값) / 표준편차값
정규화 보여주기
`);
  const value = parseFloat(output);
  assertAlmostEquals(value, 1.0, 0.0001);
});
