# 설계도: 1단계 (토크나이저) - 2. 기본 토크나이저 구조 작성

**목표:** 입력 문자열을 받아 토큰 스트림을 생성하는 `Lexer` 구조체와 핵심 메서드의 기본 틀을 마련합니다.

**이행 절차:**

1.  **`interpreter/lexer.go` 파일 생성:**
    *   작업: `interpreter` 디렉토리 내에 `lexer.go`라는 새 파일을 생성합니다.
    *   확인: 파일이 정상적으로 생성되었는지 확인합니다.
2.  **`Lexer` 구조체 정의:**
    *   작업: `lexer.go` 파일에 `Lexer` 구조체를 정의합니다. 이 구조체는 다음 필드를 포함합니다:
        *   `input []rune`: 분석할 전체 입력 문자열 (룬 슬라이스로 변환).
        *   `position int`: 현재 읽고 있는 문자의 위치 (현재 문자를 가리킴).
        *   `readPosition int`: 다음에 읽을 문자의 위치 (현재 문자 다음을 가리킴).
        *   `ch rune`: 현재 분석 중인 문자.
    *   확인: `Lexer` 구조체가 필드와 함께 올바르게 정의되었는지 확인합니다.
3.  **`NewLexer` 생성자 함수 작성:**
    *   작업: `NewLexer(input string) *Lexer` 함수를 작성합니다. 이 함수는 `Lexer` 구조체를 초기화하고 포인터를 반환합니다.
        *   입력 `input` 문자열을 `[]rune`으로 변환하여 `Lexer`의 `input` 필드에 저장합니다.
        *   `position`을 `0`으로, `readPosition`을 `0`으로 초기화합니다. (readChar 호출 시 readPosition이 먼저 증가하므로)
        *   첫 번째 문자를 읽어 `ch` 필드에 설정하기 위해 `readChar()` 헬퍼 메서드를 호출합니다.
    *   확인: `NewLexer`를 호출하여 `Lexer` 인스턴스를 생성하고, 초기 필드 값들이 올바른지 (특히 `ch`가 첫 문자를 가리키는지) 간단히 검증합니다.
4.  **`readChar()` 헬퍼 메서드 작성:**
    *   작업: `Lexer`의 메서드로 `readChar()`를 작성합니다. 이 메서드는 `Lexer`의 `ch`를 다음 문자로 업데이트하고, `position`과 `readPosition`을 증가시킵니다.
        *   `readPosition`이 `input` 슬라이스의 길이보다 크거나 같으면 (EOF), `ch`를 0 (NUL 룬, `\x00`)으로 설정합니다.
        *   그렇지 않으면, `input[readPosition]`의 룬을 `ch`에 할당합니다.
        *   `position`을 `readPosition`으로 업데이트합니다.
        *   `readPosition`을 1 증가시킵니다.
    *   확인: `readChar`가 룬을 정확히 읽고 위치를 업데이트하는지, EOF 처리가 올바른지 확인합니다.
5.  **`NextToken()` 메서드 기본 틀 작성:**
    *   작업: `Lexer`의 메서드로 `NextToken() Token`을 작성합니다. 이 메서드는 현재 `ch` 문자를 기반으로 토큰을 결정하고 반환합니다.
        *   초기 구현에서는 `ch`가 0 (EOF)일 경우 `EOF` 토큰을 반환하고, 그 외의 경우에는 `ILLEGAL` 토큰을 반환하도록 합니다. (ILLEGAL 토큰의 리터럴은 현재 문자 `ch`가 될 수 있음)
        *   각 토큰을 반환하기 전에 `readChar()`를 호출하여 다음 문자를 준비시킵니다. (단, ILLEGAL 토큰의 경우 현재 문자를 리터럴로 사용하고 다음 문자로 넘어감)
    *   확인: `NewLexer("").NextToken()`이 `EOF` 토큰을 반환하는지, `NewLexer("+").NextToken()`이 (현재는) `ILLEGAL` 토큰("+")을 반환하고 그 다음 호출이 `EOF`를 반환하는지 확인합니다.
6.  **기본 구조 테스트 작성 (`lexer_test.go`):**
    *   작업: `interpreter/lexer_test.go` 파일을 생성하고, `TestLexer_InitialStateAndReadChar` 테스트 함수를 작성하여 `NewLexer`가 `Lexer`를 올바르게 초기화하고 `readChar`가 잘 동작하는지 확인합니다. 또한, `TestNextToken_EOFOnlyAndIllegal` 테스트 함수를 작성하여 빈 문자열 입력 시 `EOF` 토큰, 알 수 없는 문자 입력 시 `ILLEGAL` 토큰 및 `EOF`가 순서대로 반환되는지 확인합니다.
    *   확인: 테스트가 `Lexer`의 초기 상태, 문자 읽기, EOF 및 ILLEGAL 토큰 처리의 기본 동작을 검증하는지 확인합니다.
