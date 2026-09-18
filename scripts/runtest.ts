import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

// Main uses @mention with the base context variable + postposition
session.addModule('main', `"누렁아 {10} 먹자 그리고 {20 + 30}도 먹자" 보여주기`)

await session.runModule('main')

// console
