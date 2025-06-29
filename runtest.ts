import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS({ prompt }))

await session.setBaseContext(
    `
번역(QuickJS), (문장) 물어보기
***
어쩌라고요
    return prompt(문장)
***
`,
)

session.addModule(
    'main',
    `
이름 = "이름이 뭐예요?" 물어보기
나이 = "몇 살이에요?" 물어보기

"안녕, " + 이름 + "님! 당신은 " + 나이 + "살이군요!" 보여주기
`,
)

await session.runModule('main')
