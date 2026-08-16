import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

session.addModule('main', `
약속, 이동하기(가로, 세로)
    "가로로 {가로} 만큼, 세로로 {세로}만큼 이동해요" 보여주기

이동하기
    가로: 10`)

const result = await session.runModule('main')
