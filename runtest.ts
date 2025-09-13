import { YaksokSession } from "@dalbit-yaksok/core";
import { Pyodide } from "@dalbit-yaksok/pyodide";

const session = new YaksokSession()
await session.extend(new Pyodide())

const main = session.addModule(
    'main',
    `from numpy import array, sum
sum(array([1, 2, 3, 4])) 보여주기`,
)

await main.run()
