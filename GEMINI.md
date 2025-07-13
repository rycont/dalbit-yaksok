# Resources

## '달빛 약속'은 어떤 프로젝트인가요?

'달빛 약속'은 한국어의 자연스러운 구문을 바탕으로 만들어진 프로그래밍 언어입니다.

```
약속, (대상)이여/여 지금 내게 나타나거라
    대상 + " 등장" 보여주기

"숫가락" 이여 지금 내게 나타나거라
"포크" 여 지금 내게 나타나거라

내가_좋아하는_음식들 = ["포도", "딸기"]

반복 내가_좋아하는_음식들 의 과일
    과일 + " 사주세요~!" 보여주기
```

코드를 실행하는 데 Deno가 필요합니다. 만약 설치되어 있지 않다면 다음의 명령을 사용하세요:

```bash
npm i -g deno
```

## 1. 코드북 (Codebook)

-   **0. 서문**: [docs/codebook/00.introduction.md](docs/codebook/00.introduction.md)
    -   이 코드북의 목적과 '달빛 약속' 프로젝트의 철학, 전체 코드 구조, 소스코드 변환 과정, 핵심 클래스 및 함수 역할, 그리고 새로운 기능 추가/버그 수정 시 참고할 부분을 소개합니다.
-   **1. 시작하기: 개발 환경 설정**: [docs/codebook/01.getting-started.md](docs/codebook/01.getting-started.md)
    -   '달빛 약속' 코드를 실행하고 수정하기 위한 Deno 및 Git 설치 방법, 프로젝트 코드 클론, 그리고 `deno task nested-test` 명령어를 통한 환경 설정 확인 과정을 안내합니다.
-   **2. 전체 아키텍처: 코드 한 줄의 여정**: [docs/codebook/02.architecture-overview.md](docs/codebook/02.architecture-overview.md)
    -   '달빛 약속' 코드가 토크나이저, 파서, 실행기를 거쳐 최종 결과물로 변환되는 전체 파이프라인을 높은 수준에서 설명합니다.
-   **Core: 소개**: [docs/codebook/core/00.introduction.md](docs/codebook/core/00.introduction.md)
    -   `core` 디렉터리가 '달빛 약속' 언어의 모든 핵심 로직(토크나이저, 파서, 실행기, 값 시스템, 스코프, 에러 처리 등)을 담고 있는 심장부임을 소개하고 각 부품의 역할을 간략히 설명합니다.
-   **Core: 1. 토크나이저**: [docs/codebook/core/01.tokenizer.md](docs/codebook/core/01.tokenizer.md)
    -   코드 문자열을 의미 있는 가장 작은 단위인 '토큰'으로 변환하는 과정(토크나이징 또는 어휘 분석)과 토큰의 개념, 그리고 주석과 같은 문법적으로 의미 없는 부분을 걸러내는 역할을 설명합니다.
-   **Core: 2. 파서**: [docs/codebook/core/02.parser.md](docs/codebook/core/02.parser.md)
    -   토큰 목록을 문법적인 구조를 가진 '추상 구문 트리(AST)'로 엮어내는 과정(파싱 또는 구문 분석)과 AST의 역할, 그리고 '달빛 약속'에서 사용되는 Shift-Reduce 파서의 특징을 설명합니다.
-   **Core: 3. 실행기**: [docs/codebook/core/03.executer.md](docs/codebook/core/03.executer.md)
    -   파서가 생성한 AST를 순회하며 실제 작업을 수행하는 '코드 실행의 프로젝트 매니저'로서의 실행기 역할, `Scope` (실행 컨텍스트) 관리, AST 노드 실행 위임, 그리고 `ReturnSignal`, `BreakSignal`과 같은 제어 흐름 시그널 처리 메커니즘을 설명합니다.
-   **Core: 4. Session과 CodeFile**: [docs/codebook/core/04.session-and-codefile.md](docs/codebook/core/04.session-and-codefile.md)
    -   '달빛 약속' 코드 실행의 두 가지 핵심 축인 `YaksokSession` (실행 환경의 총괄 지휘자, 공개 API)과 `CodeFile` (소스코드 파일의 대리인, 지연 평가 및 캐싱)의 역할과 상호작용을 설명합니다.
-   **Core: 5. 값 시스템**: [docs/codebook/core/05.value-system.md](docs/codebook/core/05.value-system.md)
    -   '달빛 약속'이 다루는 모든 데이터의 계층 구조(`ValueType`, `PrimitiveValue`, `ObjectValue`)와 주요 값 타입(숫자, 문자열, 불리언, 목록, 함수)의 내부 표현 및 특징을 설명합니다.
-   **Core: 6. 스코프 시스템**: [docs/codebook/core/06.scope-system.md](docs/codebook/core/06.scope-system.md)
    -   변수와 함수의 유효 범위를 결정하는 `Scope` 클래스의 역할, 스코프 체인을 통한 렉시컬 스코핑 구현, 그리고 전역 스코프, 함수 호출, 블록 스코프 등 새로운 스코프가 생성되는 상황을 설명합니다.
-   **Core: 7. 확장 시스템**: [docs/codebook/core/07.extensions.md](docs/codebook/core/07.extensions.md)
    -   '달빛 약속'이 외부 JavaScript/TypeScript 환경과 상호작용할 수 있도록 하는 FFI(Foreign Function Interface)의 목적, `Extension` 인터페이스의 구조와 역할, 그리고 `YaksokSession`과의 연동 방식을 QuickJS 확장 예시와 함께 설명합니다.
-   **Core: 8. 에러 처리**: [docs/codebook/core/08.error-handling.md](docs/codebook/core/08.error-handling.md)
    -   '달빛 약속'의 체계적인 에러 처리 시스템을 설명하며, 모든 에러의 기본이 되는 `YaksokError` 클래스의 정보(코드, 메시지, 리소스, 위치), 에러의 종류 분류, `renderErrorString` 함수를 통한 사용자 친화적인 메시지 렌더링, 그리고 에러 전파 및 처리 방식을 다룹니다.
-   **부록: 1. 테스트 가이드**: [docs/codebook/appendix/01.test-guide.md](docs/codebook/appendix/01.test-guide.md)
    -   '달빛 약속' 프로젝트의 테스트 실행 방법(전체, 특정 파일/케이스), `test/` 디렉터리 구조, `.yak`과 `.yak.out` 파일을 이용한 편리한 테스트 컨벤션, 그리고 TypeScript를 이용한 고급 테스트 작성 방법을 안내하며 테스트의 중요성을 강조합니다.
-   **부록: 2. 기여 가이드**: [docs/codebook/appendix/02.contribution-guide.md](docs/codebook/appendix/02.contribution-guide.md)
    -   '달빛 약속' 프로젝트에 기여하는 전반적인 워크플로우(저장소 포크, 코드 변경, 테스트, 풀 리퀘스트 생성)와 코딩 스타일 및 컨벤션(Prettier, Madge)을 설명합니다.

## 2. 언어 (Language)

-   **1. 시작하기**: [docs/language/1. getting-started.md](docs/language/1. getting-started.md)
    -   '달빛 약속' 언어의 기본적인 코드 작성 및 실행 방법을 통해 언어에 익숙해지는 첫 단계를 안내합니다.
-   **2. 보여주기 (Print)**: [docs/language/2. print.md](docs/language/2. print.md)
    -   '달빛 약속'에서 값을 화면에 출력하는 `보여주기` 기능의 사용법을 설명하며, 다른 프로그래밍 언어의 `print` 함수와 유사함을 언급합니다.
-   **3. 숫자와 연산**: [docs/language/3. numbers-and-operations.md](docs/language/3. numbers-and-operations.md)
    -   '달빛 약속'에서 지원하는 기본적인 사칙연산(`+`, `-`, `*`, `/`)과 고급 연산(`**`, `%`, `//`), 그리고 괄호를 사용한 연산 우선순위 지정 방법을 설명합니다.
-   **4. 변수**: [docs/language/4. variables.md](docs/language/4. variables.md)
    -   값을 저장하고 재사용하는 공간인 변수의 개념, 값 변경 방법, 계산에서의 활용, 그리고 변수 이름 짓기 규칙 및 좋은/나쁜 예시를 통해 가독성 높은 코드 작성법을 안내합니다.
-   **5. 문자**: [docs/language/5. strings.md](docs/language/5. strings.md)
    -   '달빛 약속'에서 문자열을 다루는 방법(따옴표 사용), 덧셈 기호(`+`)를 사용한 문자 이어붙이기, 그리고 곱셈 기호(`*`)를 사용한 문자 반복하기 기능을 설명합니다.
-   **6. 목록**: [docs/language/6. lists.md](docs/language/6. lists.md)
    -   여러 개의 값을 하나로 묶어서 저장하는 '목록'의 개념, 목록 생성 방법(`[]`), 특정 위치의 값 가져오기 및 바꾸기, 그리고 여러 위치의 값을 한 번에 가져오는 방법을 설명합니다.
-   **7. 조건문**: [docs/language/7. conditionals.md](docs/language/7. conditionals.md)
    -   주어진 조건에 따라 다른 동작을 실행하는 조건문의 개념, 조건식에 사용되는 연산자(`>`, `<`, `>=`, `<=`, `==`), `만약`, `아니면`, `아니면 만약`을 사용한 조건 분기, 그리고 겹친 조건문 사용법을 설명합니다.
-   **8. 논리 연산자**: [docs/language/8. logical-operators.md](docs/language/8. logical-operators.md)
    -   여러 개의 참/거짓을 비교하여 복잡한 조건을 만들 때 사용하는 논리 연산자 `이고` (AND)와 `이거나` (OR)의 사용법을 예제와 함께 설명합니다.
-   **9. 반복문**: [docs/language/9. loops.md](docs/language/9. loops.md)
    -   특정 코드를 여러 번 실행하는 반복문의 개념, `반복`과 `반복 그만`을 사용한 기본적인 반복문, 그리고 리스트의 각 항목에 대해 작업을 수행하는 `반복 리스트 의 항목 마다` 구문의 사용법을 설명합니다.
-   **10. 약속 (함수)**: [docs/language/10. functions.md](docs/language/10. functions.md)
    -   반복되는 작업을 하나의 이름으로 묶어 재사용할 수 있는 `약속` (함수)의 정의 및 사용법, 여러 개의 매개변수 사용, 그리고 한국어의 조사 변형을 반영하는 고급 기능을 설명합니다.
-   **11. 고급 불러오기**: [docs/language/11. advanced-imports.md](docs/language/11. advanced-imports.md)
    -   `@모듈명` 문법을 사용하여 다른 파일에 있는 변수와 약속을 불러와 사용하는 방법을 설명하며, 하드웨어 연동, 시각적 프로그래밍, 인공지능 등 고급 기능과의 연관성을 언급합니다.

## 3. 라이브러리 (Library)

-   **1. 시작하기**: [docs/library/1. getting-started.md](docs/library/1. getting-started.md)
    -   '달빛 약속'을 JSR 패키지로 설치하는 방법(Deno, NPX, Yarn, Pnpm, Bun)과 JavaScript/TypeScript 런타임에서 `YaksokSession`을 사용하여 약속 코드를 실행하는 기본적인 사용법을 안내합니다.
-   **2. 런타임에서 변수 가져오기**: [docs/library/2. runtime-variables.md](docs/library/2. runtime-variables.md)
    -   약속 코드 실행이 완료된 후 JavaScript/TypeScript 런타임에서 약속 코드 내에 정의된 변수의 값을 가져오는 방법을 `YaksokSession` 및 `CodeFile` 클래스와 연관 지어 설명합니다.
-   **3. 표준출력(보여주기)과 오류(stderr) 받아오기**: [docs/library/3. stdout-handling.md](docs/library/3. stdout-handling.md)
    -   약속 코드의 `보여주기` 명령을 통한 표준 출력(`stdout`)과 오류 출력(`stderr`)의 기본 동작(콘솔 출력)을 설명하고, `SessionConfig` 객체를 사용하여 이 출력 방식을 사용자 정의하는 방법을 예제와 함께 제시합니다.
-   **4. 번역: 약속을 외부 환경과 연결하기**: [docs/library/4. external-environment.md](docs/library/4. external-environment.md)
    -   '번역' 문법을 통해 '달빛 약속'이 외부 언어/런타임(예: Python, JavaScript)과 상호작용하는 FFI(Foreign Function Interface)의 개념, 활용도(외부 코드 호출, 값 전달), 그리고 `Extension` 인터페이스를 통한 외부 런타임 연결 방법을 상세히 설명합니다.
-   **4.1. 번역: QuickJS를 사용해 자바스크립트로 안전하게 번역하기**: [docs/library/4.1. quickjs-translation.md](docs/library/4.1. quickjs-translation.md)
    -   경량 JavaScript 엔진인 QuickJS를 사용하여 '달빛 약속' 코드 내에서 JavaScript 코드를 안전하게 실행하는 방법을 설명하며, `@dalbit-yaksok/quickjs` 패키지 설치 및 사용법, 그리고 QuickJS에 시스템 함수를 연결하는 방법을 안내합니다.
-   **5. 현재 실행중인 코드의 위치 가져오기(코드 실행 속도 늦추기)**: [docs/library/5. code-location-tracking.md](docs/library/5. code-location-tracking.md)
    -   '달빛 약속' 런타임이 코드 실행 과정을 시각화할 수 있도록 현재 실행 중인 코드의 위치를 알리는 기능과 `SessionConfig`의 `executionDelay` 속성을 통한 코드 실행 속도 조절, 그리고 `events.runningCode` 이벤트를 활용하는 방법을 설명합니다.
-   **6. 함수와 변수 재사용하기(Base Context)**: [docs/library/6. function-variable-reuse.md](docs/library/6. function-variable-reuse.md)
    -   `YaksokSession`의 `setBaseContext` 메서드를 사용하여 함수와 변수를 다른 소스 코드와 공유하고 재사용하는 'Base Context' 기능의 활용법(내장 함수, REPL, 유틸리티 라이브러리)과 스코프 재사용 시 주의사항을 설명합니다.

## 4. Monaco Editor 연동

-   **0. Monaco Language Provider: 웹 에디터와의 만남**: [docs/codebook/monaco-language-provider/00.introduction-and-syntax-highlighting.md](docs/codebook/monaco-language-provider/00.introduction-and-syntax-highlighting.md)
    -   `monaco-language-provider` 모듈이 Monaco Editor와 '달빛 약속' 언어를 연동하여 구문 강조 기능을 제공하는 역할과 구조를 설명하며, `nodeToColorTokens` 함수가 AST를 기반으로 색상 정보를 생성하는 핵심적인 역할을 함을 강조합니다.
-   **Monaco Editor에서 달빛약속 사용하기**: [docs/monaco/usage-guide.md](docs/monaco/usage-guide.md)
    -   `jsr:@dalbit-yaksok/monaco-language-provider` 패키지의 설치 방법과 Monaco Editor에 '달빛 약속' 언어 서비스를 적용하는 구체적인 코드 예시를 제공하며, 지원하는 기능(문법 강조, 키워드 자동 완성)을 명시합니다.
