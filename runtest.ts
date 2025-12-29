import { YaksokSession, getAutocomplete } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule(
    'main',
    `
약속, 언제나 밝게 웃기
    '우하하' 보여주기
    기름 = 10
    거름 = 1

이름 = 5
이름 보여주기
`,
)

session.validate()

console.log(
    getAutocomplete(session.getCodeFile('main'), { line: 3, column: 1 }),
)
