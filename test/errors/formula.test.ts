import { assertEquals, assertInstanceOf } from 'assert'
import { NumberValue, yaksok } from '../../core/mod.ts'

function createRandomValue(depth = 0): number | (string | number)[] {
    if (depth > 3 || Math.random() < 0.5) {
        // Number
        const randomNumber = Math.random() * 10 + 1
        return randomNumber - (randomNumber % 0.01)
    } else {
        // Formula
        return ['(', ...createRandomFormula(depth + 1), ')']
    }
}

function createRandomFormula(depth = 0): (string | number)[] {
    let len = Math.floor(Math.random() * 10) + 1

    if (len % 2 === 0) len++

    let formula: (string | number)[] = []

    for (let i = 0; i < len; i++) {
        if (i % 2 === 0) {
            formula = formula.concat(createRandomValue(depth))
        } else {
            formula.push(['+', '-', '*', '/'][Math.floor(Math.random() * 4)])
        }
    }

    return formula
}

for (let i = 0; i < 10; i++) {
    const formula = createRandomFormula().join(' ')
    Deno.test(`Compute complex formula: ${i}`, async () => {
        const code = `
나이 = ${formula}
    `

        const { mainScope: scope } = await yaksok(code)
        const 나이 = scope.getVariable('나이') as NumberValue

        assertInstanceOf(나이, NumberValue)
        assertEquals(나이.value, eval(formula))
    })
}
