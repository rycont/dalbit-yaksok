import { assertEquals, assertIsError, unreachable } from 'assert'

import {
    PlusOperator,
    NumberValue,
    SetVariable,
    Variable,
    Block,
    EOL,
} from '../node/index.ts'
import { CannotUseReservedWordForVariableNameError } from '../error/index.ts'
import { NotDefinedVariableError } from '../error/variable.ts'
import { tokenize } from '../prepare/tokenize/index.ts'
import { parse } from '../prepare/parse/index.ts'
import { Formula } from '../node/calculation.ts'
import { run } from '../runtime/run.ts'
import { Print } from '../node/misc.ts'
import { yaksok } from '../index.ts'

Deno.test('Parse Variable', () => {
    const { ast } = parse(tokenize('이름: 1', true))

    assertEquals(
        ast,
        new Block([
            new EOL(),
            new SetVariable('이름', new NumberValue(1)),
            new EOL(),
        ]),
    )
})

Deno.test('Parse variable with 이전 keyword', () => {
    const code = `
나이: 1
나이: 이전 나이 + 1    
`
    const { ast } = parse(tokenize(code, true))

    assertEquals(
        ast,
        new Block([
            new EOL(),
            new SetVariable('나이', new NumberValue(1)),
            new SetVariable(
                '나이',
                new Formula([
                    new Variable('나이'),
                    new PlusOperator(),
                    new NumberValue(1),
                ]),
            ),
            new EOL(),
        ]),
    )
})

Deno.test('Evaluate and calculate variable', () => {
    const code = `
나이: 10
나이: 이전 나이 + 1
`
    const { scope } = yaksok(code).getRunner()
    assertEquals(scope.getVariable('나이'), new NumberValue(11))
})

Deno.test('Reserved word cannot be used as variable name', () => {
    const code = `만약: 10`

    try {
        yaksok(code)
        unreachable()
    } catch (e) {
        assertIsError(e, CannotUseReservedWordForVariableNameError)
    }
})

Deno.test("Get not defined variable's value", () => {
    const ast = new Block([new Print(new Variable('나이'))])

    try {
        run(ast)
        unreachable()
    } catch (e) {
        assertIsError(e, NotDefinedVariableError)
        assertEquals(e.resource?.name, '나이')
    }
})
