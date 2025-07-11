import { yaksok } from '@dalbit-yaksok/core'
// import { QuickJS } from '@dalbit-yaksok/quickjs'

// const quickjs = new QuickJS({
//     prompt,
// })

// await quickjs.init()

try {
    await yaksok(`
약속, 테스트하기
    "첫 번째 약속" 보여주기

약속, 테스트하기
    "두 번째 약속" 보여주기
`)
} catch (error) {
    // console.error('오류 발생:', error)
}
