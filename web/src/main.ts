import { YaksokSession } from '../../core/mod.ts'
import { WebExtension } from './web-extension.ts'

async function bootstrap() {
    console.log('🌙 달빛 약속 웹 런처 시작...')

    // 1. 세션 생성 및 확장 로드
    const session = new YaksokSession()
    const ext = new WebExtension()
    ext.bindSession(session)
    await session.extend(ext)

    // 디버깅: 로드된 모듈 확인
    console.log('web-std 모듈 코드:', ext.manifest.module!['web-std'])

    // 2. 표준 라이브러리(확장에 정의됨) 로드
    try {
        // setBaseContext를 사용하여 'web-std'의 함수들이 전역에서 보이도록 설정
        // web-extension에서 정의한 모듈 코드를 가져옴
        const webStdCode = ext.manifest.module!['web-std']
        await session.setBaseContext(webStdCode)
        console.log('web-std 로드 성공 (Base Context 설정됨)')
    } catch (e) {
        console.error('web-std 로드 실패:', e)
    }

    // 3. HTML 내의 스크립트 실행
    const scripts = document.querySelectorAll('script[type="dalbit-yaksok"]')

    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i] as HTMLScriptElement
        const code = script.innerText
        const moduleName = `script-${i}`

        console.log(`📜 스크립트 실행 중: ${moduleName}`)
        console.log('실행할 코드:', code)

        try {
            session.addModule(moduleName, code)
            await session.runModule(moduleName)
        } catch (e) {
            console.error(`스크립트 실행 실패: ${moduleName}`, e)
        }
    }
}

bootstrap().catch(console.error)
