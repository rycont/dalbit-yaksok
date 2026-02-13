import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: scikit-learn logistic regression basic fit/predict',
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
            `from sklearn.linear_model import LogisticRegression

X = [[0,0], [0,1], [1,0], [1,1]]
y = [0, 0, 0, 1]

model = LogisticRegression()
model.fit(X, y)
pred = model.predict([[1,1], [0,0]])
pred 보여주기
model.score(X, y) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')

        const lines = output
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)

        const scoreLine = lines[lines.length - 1]
        const score = Number(scoreLine)
        assertEquals(Number.isFinite(score), true)
        assertEquals(score >= 0.75, true)
    },
})
