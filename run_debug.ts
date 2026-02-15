import { yaksok } from './core/mod.ts'

const code = `약속, 안녕 하기
    10 반환하기

만약 안녕 하기 > 3 이면
    "그래" 보여주기`

try {
    await yaksok(code)
} catch (e) {
    console.error(e)
}
