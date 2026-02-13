import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: sklearn dataset attribute access (iris.data / iris.target)',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += (output ? '\n' : '') + text
            },
        })

        await session.extend(new Pyodide(['scikit-learn']))

        session.addModule(
            'main',
            `from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression

iris = load_iris()
X = iris.data
y = iris.target

model = LogisticRegression()
model.fit(X, y)
model.score(X, y) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')

        const lines = output
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
        const score = Number(lines[lines.length - 1])
        assertEquals(Number.isFinite(score), true)
        assertEquals(score > 0.8, true)
    },
})
