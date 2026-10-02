# Dalbit Yaksok v6 → v7 마이그레이션

언어 코드 작성자는 **삭제된 언어 기능과 확장**을 확인하고, 런타임을 TypeScript에서 사용하는 개발자는 **세션·코드 파일·오류·확장 API**를 확인하세요.

## 언어 기능 삭제

| v6 코드에서 사용한 기능                      | v7에서 달라진 점                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 클래스와 상속                                | 클래스 노드, 인스턴스·멤버 처리 코드와 파서 규칙이 제거됐습니다. 해당 코드 파일은 v7에서 파싱하거나 실행할 수 없습니다. |
| 람다                                         | 람다 노드와 런타임 값 구현이 제거됐습니다.                                                                              |
| Python 호환 조건문 (`if` / `elif` / `else:`) | 호환 문법을 처리하던 `python-compat` 파서 규칙이 제거됐습니다.                                                          |
| 점 멤버 접근 및 메서드 호출                  | 점 접근 파서 규칙과 `FetchMember` 노드가 제거됐습니다. 기존 점 표기 호출 코드는 v7에서 지원되지 않습니다.               |

이 기능들에는 v7 코드에 일대일 대응 기능이 없습니다. 이 구문을 사용하던 코드는 기능을 다시 설계해야 합니다.

## 세션 설정과 실행 API

v6의 `SessionConfig`, `Events`, `WarningEvent` 타입은 코어의 공개 export에서 제거됐습니다. v7 세션 생성자는 `stdout`, `stderr`만 받습니다. v6 설정 중 `stdin`, `flags`, `events`, 외부 `signal`, `threadYieldInterval`, `stepUnit`, `canRunNode`에는 같은 생성자 설정이 없습니다.

`stderr`의 두 번째 인자 타입도 달라졌습니다.

- v6: `(message, machineReadableError: MachineReadableError) => void`
- v7: `(message, error: YaksokError) => void`

`MachineReadableError`와 `FEATURE_FLAG`는 공개 export에서 제거됐습니다. `Step by Step` 실행과 `events.runningCode`도 제거됐으며, `pause()`, `resume()`, `stepByStep`, `stepUnit`, `canRunNode`, `pubsub`에 대응하는 세션 API는 없습니다. 외부에서 실행을 중단하던 `signal` 설정도 v7에서 제공되지 않습니다.

v6의 `threadYieldInterval` 설정은 v7에서 고정된 300 tick 주기로 바뀌었습니다. 직접 `increaseTick()`을 호출하던 코드는 `tick()`으로 이름이 바뀌었지만 주기를 지정할 수 없습니다.

[세션 고급 설정 문서](../library/9.%20session-config-advanced.md)에는 위 설정과 제거된 디버깅·검증 API의 v6 사용례가 있습니다. [코드 위치 추적 문서](../library/5.%20code-location-tracking.md)의 `events.runningCode`도 v7에서 제거됐습니다.

`session.validate()`와 `session.getCodeFile()`도 제거됐습니다. 모듈을 등록할 때 반환되는 `CodeFile`을 보관해 사용하고, 사전 검사 오류는 `CodeFile.prepareErrors`에서 확인하세요.

### 실행 지연 설정

v6에서는 `addModule()`의 세 번째 인자로 모듈별 `executionDelay`를 설정했습니다. 이 인자와 `CodeFile.executionDelay`는 v7에서 제거됐습니다. 비슷한 지연은 `CodeFile.run()`에 `throttle`을 전달해 설정할 수 있습니다.

```ts
// v6
session.addModule('main', source, { executionDelay: 500 })
await session.runModule('main')

// v7: CodeFile 실행 시 지연 지정
const main = session.addModule('main', source)
await main.run({ throttle: 500 })
```

`events.runningCode`는 실행 위치 정보를 전달하던 API로, `throttle`은 실행 속도만 늦춥니다. 실행 위치 추적을 대체하지 않습니다. `runModules()`에는 `throttle` 인자가 없으므로 이 방식은 `CodeFile.run()`으로 직접 실행할 때 사용할 수 있습니다.

### 실행 진입점과 결과 타입

v6의 `yaksok()`과 `runModule()`은 제거됐습니다. v7에서는 `session.addModule()`로 `CodeFile`을 만든 뒤 `CodeFile.run()`을 호출하거나, 여러 파일을 `runModules(names)`로 실행합니다.

```ts
import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stdout: console.log,
    stderr: (message, error) => console.error(message, error),
})

const main = session.addModule('main', source)
const scope = await main.run()
```

v6의 `runModule()`은 `Map<string | symbol, RunModuleResult>`를 반환했습니다. v7의 `runModules()`는 `Record<이름, PromiseSettledResult<Scope>>`를 반환합니다. 따라서 `.get()`과 `reason` 판별을 그대로 사용할 수 없습니다. 특히 v7에서 실행 중 `YaksokError`가 발생하면 `CodeFile.run()`이 오류를 `stderr`로 전달하고 `Scope`를 반환합니다. 이 경우 `runModules()` 결과 상태는 `fulfilled`일 수 있으므로, `fulfilled`만으로 약속 코드의 오류 여부를 판단하면 안 됩니다.

파싱·검증 오류는 `addModule()` 중 발견되어 `prepareErrors`에 저장되고, 이때 `stderr`로도 전달됩니다. `prepareErrors`가 있는 `CodeFile.run()`은 예외를 던집니다. 이는 v6처럼 `runModule()` 결과의 `reason: 'validation'`으로 확인하던 흐름과 다릅니다.

`addModules(record)`도 제거됐습니다. 각 항목을 `addModule(name, source)`로 등록하세요.

## `CodeFile` API 변경

v6에서는 `new CodeFile(text, fileName)`으로 만든 뒤 `mount(session)`을 호출할 수 있었습니다. v7 생성자는 세션을 세 번째 인자로 받습니다. 일반적인 사용에서는 `session.addModule(fileName, text)`를 사용하세요.

v6의 `CodeFile.validate()`와 지연 파싱 흐름은 제거됐습니다. 다음 멤버도 v7의 `CodeFile`에 없습니다.

- `getTokensOptimistically()`
- `parseOptimistically()`
- `functionDeclareRanges`
- `exportedRules`
- `validationScopes`

공개 `parse()` 함수의 인자와 반환값도 바뀌었습니다.

- v6: `parse(codeFile, optimistic?)` → `{ ast, exportedRules }`
- v7: `parse(tokens, session)` → `Block`

성공적으로 실행되어 `ranScope`가 저장된 v7 `CodeFile`은 다시 `run()`할 수 없습니다. v6은 저장된 `ranScope`를 재호출 결과로 반환했습니다. 재실행에는 새 코드 파일/모듈을 사용하세요.

## Base Scope와 `Scope` 수명주기

v6은 `CodeFile`인 `baseContext`/`baseContexts`를 사용했습니다. v7은 실행된 `Scope`를 `session.useBaseScope(scope)`에 전달합니다. `setBaseContext()`와 `extend()`의 `baseContextFileName` 옵션은 제거됐습니다. 확장 매니페스트에서 기본 스코프로 사용할 모듈은 `baseScope: true`로 지정합니다.

v7은 성공적으로 실행한 코드 파일의 루트 `Scope`를 반환하기 전에 `finalize()`합니다. 그 스코프를 기본 스코프로 공유하던 경우, 하위 모듈이 기본 스코프의 기존 변수를 갱신하는 동작이 v6과 달라집니다. finalized 부모 스코프는 하위 스코프의 대입을 받아들이지 않으므로, 대입 값은 하위 스코프에 새 변수로 설정되어 기존 변수를 가릴 수 있습니다.

## 확장과 FFI

`ExtensionManifest.module`의 타입이 바뀌었습니다. v6은 파일명과 소스의 객체였고, v7은 `{ fileName, code, baseScope? }` 배열입니다.

```ts
// v6
module: { '표준': source }

// v7
module: [{ fileName: '표준', code: source, baseScope: true }]
```

`extend(extension, { baseContextFileName })`의 두 번째 인자는 제거됐습니다. 기본 스코프 설정은 위의 `baseScope` 항목을 사용하거나, 실행한 스코드를 `session.useBaseScope(scope)`에 전달하세요.

FFI 인자 타입은 객체에서 `Map`으로 바뀌었습니다. v6의 `FunctionInvokingParams`는 `{ [key: string]: ValueType }` 형태였고, v7의 `Extension.executeFFI()`와 `session.runFFI()`는 `Map<string, ValueType>`을 받습니다. 기존의 `args.name` 접근은 `args.get('name')`으로 바꿔야 합니다. `FunctionInvokingParams` 타입도 v7 공개 export에 없습니다.

`eventCreation` 구독 콜백의 인자도 객체에서 `Map`으로 바뀌었고, 콜백은 `Promise<void>`를 반환할 수 있습니다.

확장 초기화 순서도 바뀌었습니다. v6은 매니페스트 모듈을 등록한 뒤 `init()`을 기다렸고, `baseContextFileName`으로 지정된 코드는 그 다음 실행했습니다. v7은 `init()`을 시작한 뒤 매니페스트의 각 모듈 코드를 바로 실행하고 마지막에 `init()` 완료를 기다립니다. 모듈 실행 중 초기화가 끝난 FFI 환경을 사용하던 확장은 이 순서에 맞게 초기화를 조정해야 합니다.

## 제거된 패키지와 도구

다음 v6 패키지는 v7 저장소 워크스페이스에서 제거됐습니다.

- `@dalbit-yaksok/standard`
- `@dalbit-yaksok/dala-analyze`
- `@dalbit-yaksok/pyodide`
- `@dalbit-yaksok/monaco-language-provider`

이 패키지에 의존하던 프로젝트는 해당 기능의 의존성과 import를 별도로 바꿔야 합니다. `getAutocomplete()`도 코어 공개 API에서 제거됐습니다. 새 에디터 패키지는 기존 Monaco 언어 제공자의 호환 구현이 아닙니다.

## 마이그레이션 점검표

- [ ] 약속 코드에서 클래스, 람다, Python 호환 조건문, 점 멤버 접근을 사용하는지 확인합니다.
- [ ] `yaksok()`, `runModule()`, `addModules()` 호출을 찾아 새 실행 API로 옮깁니다.
- [ ] `reason` 결과 판별과 `stderr` 오류 처리를 점검합니다.
- [ ] `SessionConfig`, 실행 이벤트, 취소·단계별 실행 설정에 의존하는 코드를 확인합니다.
- [ ] `executionDelay`, `events.runningCode` 사용처를 확인합니다.
- [ ] `CodeFile` 직접 생성, 검증, 캐시 재실행, 파서 API 사용처를 확인합니다.
- [ ] Base Scope 변수 갱신 동작과 확장 초기화 순서를 점검합니다.
- [ ] 제거된 확장 패키지와 Monaco 연동을 교체합니다.
