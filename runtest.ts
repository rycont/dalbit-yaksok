import { yaksok } from './core/mod.ts'

const CODE = `사과_갯수: 127
사람_수: 4

"사과가 " + 사과_갯수 + "개, 사람이 " + 사람_수 + "명 있습니다" 보여주기
"한 사람당 " + 사과_갯수 // 사람_수 + "개씩 먹고, " + 사과_갯수 % 사람_수 + "개가 남습니다" 보여주기`

yaksok(CODE)
