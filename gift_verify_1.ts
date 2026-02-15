import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

const session = new YaksokSession()
const standard = new StandardExtension()
await session.extend(standard)

// '표준' 모듈의 '바꾸기' 기능을 사용할 수 있도록 설정 (실제 약속 코드 내에서 '번역(표준)'을 사용하므로 생략 가능할 수 있으나, 명시적으로 base context를 잡는 것이 안전함)
// standard.manifest.module!['표준'] 에는 위에서 정의한 한글 헤더들이 들어있음
await session.setBaseContext(standard.manifest.module!['표준'])

session.addModule(
    'main',
    `
"안녕, 세상아!"에서 "안녕"을 "반가워"로 바꾸기 보여주기
`,
)

try {
    await session.runModule('main')
    console.log("테스트 성공!")
} catch (e) {
    console.error("테스트 실패:", e)
}
