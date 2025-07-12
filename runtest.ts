import { YaksokSession } from '@dalbit-yaksok/core'

const code = {
    main: `
"a" 보여주기
@imported "b" 출력하기
"c" 보여주기
        `,
    imported: `
@nested "!"라고 말하기
약속, (text) 출력하기
    text 보여주기
        `,
    nested: `
약속, (text)라고 말하기
    text 보여주기
        `,
}

let output = ''

const session = new YaksokSession({
    executionDelay: 100,
})

session.addModules(code)
await session.runModule('main')
