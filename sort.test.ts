import { assertEquals } from "jsr:@std/assert";
import { YaksokSession } from "@dalbit-yaksok/core";
import { StandardExtension } from "./standard/mod.ts";

async function run(code: string): Promise<string> {
    let output = "";
    const session = new YaksokSession({
        stdout(value) {
            output += value + "\n";
        },
        stderr(value) {
            console.error(value);
        },
    });

    await session.extend(new StandardExtension());
    session.addModule("main", code);
    await session.runModule("main");

    return output.trim();
}

Deno.test("Sort - Basic ascending (numbers)", async () => {
    const code = `
목록 = [3, 1, 2]
정렬된목록 = 목록.정렬하기
정렬된목록 보여주기
`;
    const result = await run(code);
    assertEquals(result, "[1, 2, 3]");
});

Deno.test("Sort - Basic ascending (strings)", async () => {
    const code = `
목록 = ["다", "가", "나"]
정렬된목록 = 목록.정렬하기
정렬된목록 보여주기
`;
    const result = await run(code);
    assertEquals(result, '["가", "나", "다"]');
});

Deno.test("Sort - Custom comparator (descending numbers)", async () => {
    const code = `
목록 = [1, 3, 2]
정렬된목록 = 목록.(람다 앞, 뒤: 뒤 - 앞)로 정렬하기
정렬된목록 보여주기
`;
    const result = await run(code);
    assertEquals(result, "[3, 2, 1]");
});

Deno.test("Sort - Custom comparator (by string length)", async () => {
    const code = `
목록 = ["apple", "banana", "kiwi"]
정렬된목록 = 목록.(람다 앞, 뒤: 앞.길이 - 뒤.길이)로 정렬하기
정렬된목록 보여주기
`;
    const result = await run(code);
    assertEquals(result, '["kiwi", "apple", "banana"]');
});
