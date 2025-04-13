import { yaksok } from '@dalbit-yaksok/core'

// await yaksok({
//     main: `
// @직방
// @직방 보여주기
// `,
//     직방: `
// 약속, (위치) 근처 원룸 갯수 가져오기
//     0 반환하기

// 앱_버전 = "1.0.0"
// `,
// })

await yaksok(`
횟수 = 0

반복
	횟수 보여주기
	횟수 = 횟수 + 1

	만약 횟수 == 10 이면
		반복 그만
`)
