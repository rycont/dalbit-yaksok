import { assert, assertIsError } from '@std/assert'
import {
    InvalidTypeForCompareError,
    InvalidTypeForOperatorError,
} from '../core/error/index.ts'
import { yaksok } from '../core/mod.ts'

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
