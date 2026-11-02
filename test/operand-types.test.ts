import { test, expect } from 'vite-plus/test'

import {
    YaksokSession,
    InvalidTypeForCompareError,
    InvalidTypeForOperatorError,
} from '@dalbit-yaksok/core'

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
    test(`Invalid type for calculation operator ${operator}`, async () => {
        const code = `
            ${a} ${operator} ${b}
        `.trim()

        const errors: unknown[] = []
        const session = new YaksokSession({
            stderr(_message, error) {
                errors.push(error)
            },
        })
        const codeFile = session.addModule('main', code)
        await codeFile.run()
        expect(errors[0]).toBeInstanceOf(InvalidTypeForOperatorError)
    })
}

for (const { a, b, operator } of WRONG_CASES_FOR_COMPARISON) {
    test(`Invalid type for comparison operator ${operator}`, async () => {
        const code = `
            ${a} ${operator} ${b}
        `.trim()

        const errors: unknown[] = []
        const session = new YaksokSession({
            stderr(_message, error) {
                errors.push(error)
            },
        })
        const codeFile = session.addModule('main', code)
        await codeFile.run()
        expect(errors[0]).toBeInstanceOf(InvalidTypeForCompareError)
    })
}
