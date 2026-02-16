import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assert, assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: 다양한 Python builtin 전역 함수 호출',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const lines: string[] = []

        const session = new YaksokSession({
            stdout: (text) => {
                lines.push(text)
            },
        })

        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `print("PY")
abs(-7) 보여주기
round(3.14159, 2) 보여주기
pow(2, 8) 보여주기
len([1, 2, 3, 4]) 보여주기
sum([1, 2, 3, 4]) 보여주기
min([4, 1, 9]) 보여주기
max([4, 1, 9]) 보여주기
all([True, True, False]) 보여주기
any([False, False, True]) 보여주기
list(range(1, 5)) 보여주기
sorted([3, 1, 2]) 보여주기
list(reversed([1, 2, 3])) 보여주기
list(enumerate(["a", "b"])) 보여주기
str(1234) 보여주기
int("42") 보여주기
float("2.5") 보여주기
bool(0) 보여주기
bool(5) 보여주기
chr(65) 보여주기
ord("A") 보여주기
hex(255) 보여주기
bin(5) 보여주기
list(map(abs, [-1, -3, 2])) 보여주기
list(filter(bool, [0, 1, 2, 0])) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'finish')

        const compact = lines.map((line) => line.replace(/\s+/g, ''))

        assertEquals(lines[0], 'PY')
        assertEquals(lines[1], '7')
        assertEquals(lines[2], '3.14')
        assertEquals(lines[3], '256')
        assertEquals(lines[4], '4')
        assertEquals(lines[5], '10')
        assertEquals(lines[6], '1')
        assertEquals(lines[7], '9')
        assertEquals(lines[8], '거짓')
        assertEquals(lines[9], '참')
        assertEquals(compact[10], '[1,2,3,4]')
        assertEquals(compact[11], '[1,2,3]')
        assertEquals(compact[12], '[3,2,1]')

        assert(compact[13].includes('a'))
        assert(compact[13].includes('b'))
        assert(compact[13].includes('0'))
        assert(compact[13].includes('1'))

        assertEquals(lines[14], '1234')
        assertEquals(lines[15], '42')
        assertEquals(lines[16], '2.5')
        assertEquals(lines[17], '거짓')
        assertEquals(lines[18], '참')
        assertEquals(lines[19], 'A')
        assertEquals(lines[20], '65')
        assertEquals(lines[21], '0xff')
        assertEquals(lines[22], '0b101')
        assertEquals(compact[23], '[1,3,2]')
        assertEquals(compact[24], '[1,2]')
    },
})
