import { assert, assertEquals, assertInstanceOf, assertIsError } from 'assert'
import {
    InvalidTypeForCompareError,
    InvalidTypeForOperatorError,
} from '../core/error/index.ts'
import { NumberValue, StringValue, yaksok } from '../core/mod.ts'

const WRONG_CASES_FOR_CALCULATION = [
    {
        a: "'홍길동'",
        b: "'홍길동'",
        operator: '*',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '/',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '//',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '-',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '-',
    },
    {
        a: "'홍길동'",
        b: "'지민'",
        operator: '**',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '**',
    },
    {
        a: "'홍길동'",
        b: '[1, 2, 3]',
        operator: '+',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '이고',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '거나',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '%',
    },
]

const WRONG_CASES_FOR_COMPARISON = [
    {
        a: "'홍길동'",
        b: 10,
        operator: '<',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '<',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '>',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '>',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '<=',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '<=',
    },
    {
        a: "'홍길동'",
        b: 10,
        operator: '>=',
    },
    {
        a: 10,
        b: "'홍길동'",
        operator: '>=',
    },
]

for (const { a, b, operator } of WRONG_CASES_FOR_CALCULATION) {
    Deno.test(`Invalid type for calculation operator ${operator}`, async () => {
        const code = `
            ${a} ${operator} ${b}
        `.trim()
        const result = await yaksok(code)
        assert(
            result.reason === 'error',
            `Expected an error, but got ${result.reason}`,
        )
        assertIsError(result.error, InvalidTypeForOperatorError)
    })
}

for (const { a, b, operator } of WRONG_CASES_FOR_COMPARISON) {
    Deno.test(`Invalid type for comparison operator ${operator}`, async () => {
        const code = `
            ${a} ${operator} ${b}
        `.trim()
        const result = await yaksok(code)
        assert(
            result.reason === 'error',
            `Expected an error, but got ${result.reason}`,
        )
        assertIsError(result.error, InvalidTypeForCompareError)
    })
}

const VALID_CASES_FOR_COMPOUND_OPERATORS = [
    {
        a: 10,
        b: 5,
        operator: '+=',
        expected: 15,
    },
    {
        a: 10,
        b: 5,
        operator: '-=',
        expected: 5,
    },
    {
        a: 10,
        b: 5,
        operator: '*=',
        expected: 50,
    },
    {
        a: 10,
        b: 5,
        operator: '/=',
        expected: 2,
    },
    {
        a: 10,
        b: 5,
        operator: '%=',
        expected: 0,
    },
    {
        a: 10,
        b: '"홍길동"',
        operator: '+=',
        expected: '10홍길동',
    },
    {
        a: 20,
        b: '"루이14세"',
        operator: '*=',
        expected:
            '루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세루이14세',
    },
]

const INVALID_CASES_FOR_COMPOUND_OPERATORS = [
    {
        a: '"세종대왕"',
        b: 15,
        operator: '-=',
    },
    {
        a: '"닐 암스트롱"',
        b: 25,
        operator: '/=',
    },
    {
        a: 30,
        b: '"에디슨"',
        operator: '%=',
    },
]

for (const { a, b, operator, expected } of VALID_CASES_FOR_COMPOUND_OPERATORS) {
    Deno.test(`Valid compound operator ${operator}`, async () => {
        const code = `result = ${a}
result ${operator} ${b}`.trim()
        const result = await yaksok(code)

        assert(
            result.reason === 'finish',
            `Expected finish, got ${result.reason}`,
        )

        const resultValue = result.codeFile.ranScope!.getVariable('result')

        const expectedType =
            typeof a === 'string' || typeof b === 'string'
                ? StringValue
                : NumberValue
        assertInstanceOf(resultValue, expectedType)

        assertEquals(
            resultValue.value,
            expected,
            `Expected ${expected}, got ${resultValue.value}`,
        )
    })
}

for (const { a, b, operator } of INVALID_CASES_FOR_COMPOUND_OPERATORS) {
    Deno.test(`Invalid compound operator ${operator}`, async () => {
        const code = `result = ${a}
result ${operator} ${b}`.trim()
        const result = await yaksok(code)
        assert(
            result.reason === 'error',
            `Expected an error, but got ${result.reason}`,
        )
        assertIsError(result.error, InvalidTypeForOperatorError)
    })
}
