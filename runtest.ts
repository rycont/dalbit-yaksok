import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule(
    'main',
    `
하랑봇 오른쪽으로 일보 가 보여주기

약속, (반지름)으로 원의 넓이 계산하기
	반지름 * 반지름 * 3.14 반환하기

약속, (이름)에게 인사하기
	이름 + "님, 안녕하세요!" 반환하기

반지름이 5 인 원의 넓이 계산하기 보여주기
이름이 "홍길동" 인게 인사하기 보여주기
1이름 = "홍길동",
`,
)

await session.runModule('main')
