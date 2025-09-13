import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: numpy array sum',
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += text
            },
        })

        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `from numpy import array
from numpy import sum
int(sum(array([1, 2, 3, 4]))) 보여주기`,
        )

        const result = await session.runModule('main')

        if(result.reason === 'error') {
            console.error(result.error)
        }

        assertEquals(result.reason, 'finish')
        assertEquals(output.trim(), '10')
    },
})


