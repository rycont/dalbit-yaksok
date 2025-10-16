import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'

let output = ''

const session = new YaksokSession({
    stdout: (text) => {
        output += text
    },
})

await session.extend(new Pyodide(['numpy']))

session.addModule(
    'main',
    `from numpy import array
from numpy import sum
sum(array([1, 2, 3, 4])) 보여주기`,
)

const result = await session.runModule('main')

if (result.reason === 'error') {
    console.error(result.error)
}

console.log(output)
