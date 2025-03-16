import { yaksok } from '@dalbit-yaksok/core'

await yaksok(
    `
약속, 키가 (키)cm이고 몸무게가 (몸무게)kg일 때 비만도
	몸무게 / (키 / 100 * 키 / 100) 반환하기

비만도 = 키가 (177)cm이고 몸무게가 (68)kg일 때 비만도
비만도 보여주기
`,
)
