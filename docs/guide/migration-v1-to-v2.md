# Dalbit Yaksok v1 → v2 변경 사항

Dalbit Yaksok v2.0.0은 런타임 아키텍처와 FFI(외부 함수 인터페이스) 시스템을 개선하는 데 중점을 둔 **주요 API 변경**이 포함된 업데이트입니다. 이는 주로 **개발자를 위한 업데이트**로, 인터프리터 초기화 방식과 외부 런타임 통합 방식이 재설계되었습니다.

**핵심 변경 사항:** `Runtime` 클래스 → `YaksokSession` 클래스로 변경, 모듈 관리 및 확장 시스템 강화.

---

## 🚨 주요 변경 사항 (Breaking Changes)

### 1. 메인 API: `Runtime` → `YaksokSession`

Yaksok 코드를 실행하는 핵심 클래스의 이름과 설계가 변경되었습니다.

#### v1.x (기존)
```typescript
import { yaksok, Runtime } from '@dalbit-yaksok/core'

// 간단한 사용
await yaksok(code)

// 고급 사용
const runtime = new Runtime(
    { 'main.yak': code },
    { stdout: console.log }
)
await runtime.run()
```

#### v2.0 (신규)
```typescript
import { YaksokSession } from '@dalbit-yaksok/core'

// 세션 생성
const session = new YaksokSession({ 
    stdout: console.log 
})

// 모듈 추가 및 실행
session.addModule('main', code)
await session.runModule('main')
```

**마이그레이션:**
- `new Runtime(codeTexts, config)`을 `new YaksokSession(config)` + `session.addModule(name, code)`로 변경하세요.
- `runtime.run()`을 `session.runModule(moduleName)`로 변경하세요.
- 코드는 생성자가 아닌 `addModule`을 통해 추가합니다.

---

### 2. 설정: `RuntimeConfig` → `SessionConfig`

설정 타입의 이름과 구조가 변경되었습니다.

#### v1.x (기존)
```typescript
import type { RuntimeConfig } from '@dalbit-yaksok/core'

const config: RuntimeConfig = {
    stdout: (text) => console.log(text),
    stderr: (text) => console.error(text),
    runFFI: (name, code, args) => { /* 커스텀 FFI */ },
    executionDelay: 0,
    entryPoint: 'main.yak',
    flags: { /* 기능 플래그 */ }
}
```

#### v2.0 (신규)
```typescript
import type { SessionConfig } from '@dalbit-yaksok/core'

const config: SessionConfig = {
    stdout: (text) => console.log(text),
    stderr: (text) => console.error(text),
    stdin: async () => prompt('입력:'),  // 신규: 입력 핸들러
    events: { /* 이벤트 핸들러 */ },      // 신규: 이벤트 시스템
    flags: { /* 기능 플래그 */ },
    threadYieldInterval: 1000            // 신규: 실행 제어
}
```

**마이그레이션:**
- `RuntimeConfig` → `SessionConfig`로 이름 변경
- `runFFI`, `executionDelay`, `entryPoint` 제거 (다른 방식으로 처리됨)
- 필요시 `stdin` 추가
- 런타임 이벤트 구독을 위해 `events` 사용

---

### 3. FFI/확장 시스템: 완전 재설계

외부 함수 인터페이스(FFI) 시스템이 완전히 개편되었습니다.

#### v1.x (기존)
```typescript
// runFFI 콜백을 통해 수동으로 통합
import { QuickJS } from '@dalbit-yaksok/quickjs'

const quickjs = new QuickJS({
    alert: (msg) => window.alert(msg)
})
await quickjs.init()

const runtime = new Runtime(
    { 'main.yak': code },
    {
        runFFI: (name, code, args) => {
            if (name === 'QuickJS') {
                return quickjs.run(code, args)
            }
        }
    }
)
```

#### v2.0 (신규)
```typescript
// 확장은 Extension 인터페이스를 구현
import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()

const quickjs = new QuickJS({
    alert: (msg) => window.alert(msg)
})

// 확장 패턴: init + extend
await session.extend(quickjs)

session.addModule('main', code)
await session.runModule('main')
```

**새로운 확장 인터페이스:**
```typescript
interface Extension {
    manifest: ExtensionManifest  // 메타데이터
    init?(): Promise<void>       // 선택적 초기화
    executeFFI(
        code: string, 
        args: FunctionInvokingParams,
        scope: Scope
    ): ValueType
}
```

**마이그레이션:**
- 커스텀 `runFFI` 콜백을 `Extension` 구현체로 변경하세요.
- `session.extend(extension)`을 사용하여 확장을 등록하세요.
- QuickJS 등은 이제 `Extension` 인터페이스를 직접 구현합니다.

---

### 4. 모듈 관리: 다중 모듈 지원

v2는 다중 모듈과 베이스 컨텍스트를 일급 객체로 지원합니다.

#### v2.0 신규 기능
```typescript
const session = new YaksokSession()

// 다중 모듈 등록
session.addModule('utils', `약속, (목록)을 정렬하기 ...`)
session.addModule('main', `"utils" 사용하기\n[3,1,2]을 정렬하기`)

// 특정 모듈 실행
await session.runModule('main')

// 베이스 컨텍스트 (모든 모듈에서 공유)
session.addModule(
    session.BASE_CONTEXT_SYMBOL, 
    `약속, 디버그 ...`,
    { baseContextFileName: ['utils'] }
)
```

---

### 5. 문법: 함수 호출 괄호 강제

`FUTURE_FUNCTION_INVOKE_SYNTAX` 기능 플래그가 **제거되었으며**, 이제 괄호 사용이 **필수**입니다.

#### v1.x (기존)
```yaksok
# 두 문법 모두 허용됨:
"치킨" 먹기           # 구식 (v2에서 제거됨)
("치킨")먹기          # 신식 (v2에서 필수)
```

#### v2.0 (신규)
```yaksok
# 괄호 문법만 허용됨:
("치킨")먹기          # ✅ 올바름
"치킨" 먹기           # ❌ 문법 오류
```

**마이그레이션:**
- 모든 함수 인자에 괄호를 추가하세요: `값 함수명` → `(값)함수명`
- 이는 FFI뿐만 아니라 모든 함수 호출에 적용됩니다.

---

### 6. 반환값: `RunModuleResult` 타입

실행 결과가 구별된 유니온 타입(Discriminated Union)으로 강력하게 타이핑되었습니다.

#### v2.0 (신규)
```typescript
type RunModuleResult = 
    | SuccessRunModuleResult
    | ErrorRunModuleResult
    | ValidationRunModuleResult
    | AbortedRunModuleResult

const results = await session.runModule('main')

for (const result of results) {
    switch (result.type) {
        case 'success':
            console.log('성공:', result.scope)
            break
        case 'error':
            console.error('오류:', result.error)
            break
        case 'validation':
            console.warn('검증 문제:', result.groups)
            break
        case 'aborted':
            console.log('실행 중단됨')
            break
    }
}
```

---

### 7. 오류 처리: 새로운 오류 타입

#### v2 신규 오류 클래스:
- `ErrorInFFIExecution`: FFI 실행 실패
- `AlreadyRegisteredModuleError`: 중복 모듈 등록
- `FFIRuntimeNotFound`: FFI 호출 시 확장 못 찾음
- `MultipleFFIRuntimeError`: 동일 런타임 이름에 대한 다중 확장

---

## ✨ 새로운 기능 (Non-Breaking)

### 1. 이벤트 시스템
```typescript
const session = new YaksokSession({
    events: {
        variableSet: (data) => console.log('변수 설정됨:', data),
        functionCall: (data) => console.log('함수 호출됨:', data),
        loopWarning: (data) => console.warn('반복문 경고:', data)
    }
})
```

### 2. 중단 시그널 (Abort Signals)
```typescript
const controller = new AbortController()
session.signal = controller.signal

setTimeout(() => controller.abort(), 5000) // 5초 후 중단
await session.runModule('main')
```

### 3. 일시 정지 및 재개
```typescript
session.paused = true
// 실행 일시 정지

session.paused = false
// 실행 재개
```

### 4. 단계별 디버깅 (Step-by-Step)
```typescript
session.stepByStep = true
session.stepUnit = IfStatement // 각 조건문마다 일시 정지
session.canRunNode = async (scope, node) => {
    return await userConfirmsStep()
}
```
