import { YaksokSession } from "@dalbit-yaksok/core";
import { Pyodide } from "@dalbit-yaksok/pyodide";

const session = new YaksokSession({
    stdout: (text) => console.log(text),
})
await session.extend(new Pyodide())

const main = session.addModule(
    'main',
    `from numpy.random import seed
from numpy.random import randint
seed(42)
arr = randint(0, 100, 12)
mat = arr.reshape(3, 4)
mat 보여주기
mat.sum() 보여주기
mat.mean() 보여주기
mat.reshape(4, 3) 보여주기`,
)

await main.run()
