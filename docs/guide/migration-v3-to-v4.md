# Dalbit Yaksok v3 → v4 변경 사항

Dalbit Yaksok v4.0.0은 **다중 모듈 실행**과 **다중 베이스 컨텍스트**를 지원하기 위한 **주요 API 변경**이 포함된 업데이트입니다. 이는 주로 **라이브러리 사용자를 위한 업데이트**로, `YaksokSession`의 실행 및 모듈 관리 방식이 재설계되었습니다.

**핵심 변경 사항:** `runModule()` 반환 타입 변경, 다중 베이스 컨텍스트 지원, `entrypoint` 속성 제거

> **언어 사용자에게:** 약속 언어 자체의 문법이나 동작은 변경되지 않았습니다. 이 가이드는 주로 TypeScript/JavaScript에서 달빛약속 런타임을 사용하는 개발자를 위한 것입니다.

---

## 🚨 주요 변경 사항 (Breaking Changes)

### 1. `runModule()` 반환 타입: `RunModuleResult` → `Map<string | symbol, RunModuleResult>`

가장 중요한 변경 사항입니다. `runModule()` 메서드가 이제 **여러 모듈을 동시에 실행**할 수 있으며, 반환 타입이 변경되었습니다.

#### v3.x (기존)

```typescript
const result = await session.runModule('main')
// result: RunModuleResult (단일 객체)

if (result.reason === 'finish') {
    console.log('성공')
}
```

#### v4.0 (신규)

```typescript
const results = await session.runModule('main')
// results: Map<string | symbol, RunModuleResult>

const result = results.get('main')!
if (result.reason === 'finish') {
    console.log('성공')
}
```

**마이그레이션:**

```typescript
// Before (v3)
const result = await session.runModule('main')

// After (v4)
const results = await session.runModule('main')
const result = results.get('main')!
```

### 2. `session.entrypoint` 속성 제거 → `session.getCodeFile()` 메서드 사용

**중요:** `entrypoint` 속성이 제거되었습니다. 이제 특정 모듈의 실행 결과에 접근하려면 `getCodeFile()` 메서드를 사용해야 합니다.

#### v3.x (기존)

```typescript
session.addModule('main', '결과 = 10')
await session.runModule('main')

const scope = session.entrypoint?.ranScope
const value = scope?.getVariable('결과')
```

#### v4.0 (신규)

```typescript
session.addModule('main', '결과 = 10')
await session.runModule('main')

const scope = session.getCodeFile('main').ranScope
const value = scope?.getVariable('결과')
```

**마이그레이션:**

```typescript
// Before (v3)
session.entrypoint?.ranScope

// After (v4)
session.getCodeFile('main').ranScope // 또는 실행한 모듈 이름
```

---

### 3. 다중 모듈 동시 실행 지원 (신규 기능)

v4부터는 여러 모듈을 배열로 전달하여 **동시에 실행**할 수 있습니다.

```typescript
session.addModule('task1', '10 보여주기')
session.addModule('task2', '20 보여주기')

// 여러 모듈을 동시에 실행
const results = await session.runModule(['task1', 'task2'])

const result1 = results.get('task1')!
const result2 = results.get('task2')!
```

---

### 4. 다중 베이스 컨텍스트 (Multiple Base Contexts) 지원

v4부터는 `setBaseContext()`를 **여러 번 호출**하여 **여러 베이스 컨텍스트를 체인**할 수 있습니다.

#### v3.x (기존)

```typescript
const session = new YaksokSession()

// 베이스 컨텍스트는 한 번만 설정 가능
await session.setBaseContext('공용변수 = 10')
```

#### v4.0 (신규)

```typescript
const session = new YaksokSession()

// 첫 번째 베이스 컨텍스트
await session.setBaseContext(`
약속, (A) (B) 더하기
    A + B 반환하기
`)

// 두 번째 베이스 컨텍스트 (첫 번째 컨텍스트를 사용 가능)
await session.setBaseContext(`
약속, (A) 제곱
    (A) (A) 더하기 반환하기
`)

// 모든 모듈에서 "더하기", "제곱"을 사용 가능
session.addModule('main', '(5 제곱) 보여주기')
await session.runModule('main') // 출력: 10
```

**특징:**

- 나중에 추가된 베이스 컨텍스트는 이전 베이스 컨텍스트의 함수/변수를 사용할 수 있습니다.
- 모든 베이스 컨텍스트는 일반 모듈에서 접근 가능합니다.
- `session.baseContexts` 배열에 순서대로 저장됩니다.

**내부 구조 변경:**

```typescript
// v3
session.baseContext // CodeFile | undefined (단일)

// v4
session.baseContexts // CodeFile[] (배열)
session.baseContext // 마지막 베이스 컨텍스트 (호환성)
```

---

## 🔧 마이그레이션 체크리스트

### 라이브러리 사용자 (TypeScript/JavaScript)

- [ ] `await session.runModule('main')` → `(await session.runModule('main')).get('main')!`
- [ ] `session.entrypoint?.ranScope` → `session.getCodeFile('main').ranScope`
- [ ] 테스트 코드에서 반환값 처리 방식 변경
- [ ] 다중 베이스 컨텍스트를 사용하는 경우 `baseContexts` 배열 확인

### 언어 사용자 (약속 코드)

- **변경 불필요**: 약속 언어 자체의 문법이나 동작은 변경되지 않았습니다.

---

## 📝 마이그레이션 예시

### 예시 1: 기본 실행 코드

```typescript
// Before (v3)
import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()
session.addModule('main', '"안녕" 보여주기')

const result = await session.runModule('main')
if (result.reason === 'finish') {
    console.log('성공')
}

// After (v4)
import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()
session.addModule('main', '"안녕" 보여주기')

const results = await session.runModule('main')
const result = results.get('main')!
if (result.reason === 'finish') {
    console.log('성공')
}
```

### 예시 2: 변수 접근

```typescript
// Before (v3)
session.addModule('main', '결과 = 42')
await session.runModule('main')

const value = session.entrypoint?.ranScope?.getVariable('결과')

// After (v4)
session.addModule('main', '결과 = 42')
await session.runModule('main')

const value = session.getCodeFile('main').ranScope?.getVariable('결과')
```

### 예시 3: 테스트 코드

```typescript
// Before (v3)
Deno.test('Boolean test', async () => {
    const session = new YaksokSession()
    session.addModule('main', '결과 = 참')
    await session.runModule('main')

    const result = session.entrypoint?.ranScope?.getVariable('결과')
    assertEquals(result.value, true)
})

// After (v4)
Deno.test('Boolean test', async () => {
    const session = new YaksokSession()
    session.addModule('main', '결과 = 참')
    await session.runModule('main')

    const result = session.getCodeFile('main').ranScope?.getVariable('결과')
    assertEquals(result.value, true)
})
```

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1: 단일 모듈만 사용하는데도 `Map`을 사용해야 하나요?

**A:** 네, v4부터는 단일 모듈 실행도 `Map`으로 반환됩니다. `.get('main')!` 같은 형태로 결과를 추출하세요.

### Q2: 기존 코드가 많은데 마이그레이션이 어려워요.

**A:** 다음 헬퍼 함수를 사용하면 코드 수정을 최소화할 수 있습니다:

```typescript
async function runModuleSingle(
    session: YaksokSession,
    name: string | symbol,
): Promise<RunModuleResult> {
    const results = await session.runModule(name)
    return results.get(name)!
}

// 사용
const result = await runModuleSingle(session, 'main')
```

### Q3: `yaksok()` 헬퍼 함수는 변경해야 하나요?

**A:** 아니요. `yaksok()` 함수는 내부적으로 호환성을 유지하도록 구현되어 있어 **변경 불필요**합니다.

```typescript
// v3, v4 모두 동일하게 동작
const result = await yaksok('"안녕" 보여주기')
```

### Q4: 베이스 컨텍스트가 여러 개 있을 때 충돌은 어떻게 처리되나요?

**A:** 나중에 추가된 베이스 컨텍스트가 우선순위가 높습니다. 동일한 변수/함수 이름이 있으면 **나중 것으로 덮어써집니다**.

---

## 🎯 왜 이 변경이 필요했나요?

### 1. 다중 모듈 실행 지원

기존에는 한 번에 하나의 모듈만 실행할 수 있었습니다. v4에서는 **여러 독립적인 코드를 동시에 실행**할 수 있어, 병렬 처리나 테스트 시나리오에서 유용합니다.

### 2. 베이스 컨텍스트 체이닝

기존에는 베이스 컨텍스트를 한 번만 설정할 수 있어, 복잡한 라이브러리 구조를 만들기 어려웠습니다. v4에서는 **베이스 컨텍스트를 여러 번 추가**하여 **계층적인 라이브러리 구조**를 만들 수 있습니다.

### 3. 더 나은 타입 안전성

`Map` 기반 반환 타입으로 **어떤 모듈의 결과인지 명확히 구분**할 수 있습니다.

---

## 🛠️ 내부 구현 변경 사항

### 1. 내부 실행 메서드 분리

`runModule()`이 이제 내부적으로 `runOneModule()`을 호출합니다:

```typescript
// v4 내부 구조
private async runOneModule(moduleName: string | symbol): Promise<RunModuleResult>

async runModule(
    moduleName: string | symbol | (string | symbol)[]
): Promise<Map<string | symbol, RunModuleResult>>
```

### 2. 베이스 컨텍스트 심볼 관리

각 베이스 컨텍스트는 이제 고유한 심볼로 관리됩니다:

```typescript
// v3: 단일 심볼
Symbol('baseContext')

// v4: 순차적 심볼
Symbol(`baseContext-0`)
Symbol(`baseContext-1`)
Symbol(`baseContext-2`)
```

### 3. `TICK` 이벤트 추가

런타임 실행 중 주기적으로 발생하는 `TICK` 이벤트가 추가되었습니다:

```typescript
const session = new YaksokSession({
    events: {
        TICK: () => {
            console.log('실행 중...')
        },
    },
})
```

---

## 📚 추가 자료

- [YaksokSession API 문서](https://dalbit-yaksok.postica.app/library/1.%20getting-started)
- [v2 → v3 마이그레이션 가이드](./migration-v2-to-v3.md)
- [v1 → v2 마이그레이션 가이드](./migration-v1-to-v2.md)
- [GitHub Pull Request #162](https://github.com/rycont/dalbit-yaksok/pull/162)

---

## 💡 요약

v4는 **"더 복잡하고 유연한 실행 환경"**을 위한 업데이트입니다.

**주요 변경:**

- ✅ `runModule()` 반환 타입: 단일 객체 → `Map`
- ✅ `entrypoint` 속성 제거 → `getCodeFile()` 사용
- ✅ 다중 모듈 동시 실행 지원
- ✅ 다중 베이스 컨텍스트 체이닝 지원

**영향:**

- 일반 사용자(약속 언어 작성자): **변경 없음**
- 런타임 임베딩 개발자: **API 변경 필요**

**마이그레이션 난이도:** 중간 (대부분 기계적인 변경)
