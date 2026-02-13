import { yaksok } from './core/mod.ts'

const code = `
6 & 10 보여주기
6 | 10 보여주기
6 ^ 10 보여주기
6 << 1 보여주기
12 >> 2 보여주기
`

const outs: string[] = []
const session = yaksok(code, {
  output: (t) => outs.push(String(t)),
  stderr: (msg) => console.error('STDERR', msg),
})

try {
  const result = await session.run()
  console.log('result', result.type)
  console.log('outs', outs)
} catch (e) {
  console.error('FAIL', e)
}
