import { yaksok } from '@dalbit-yaksok/core'

await yaksok({
    main: `
횟수 = 0

반복
	횟수 보여주기
	횟수 = 횟수 + 1

	만약 횟수 == 10 이면
		반복 그만
`,
})
