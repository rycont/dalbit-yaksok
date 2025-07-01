# 설계도: 2. 숫자 리터럴 파싱 및 평가

**목표:** 입력 문자열이 숫자(정수 또는 실수)일 경우, 이를 올바른 숫자 타입(Go에서는 `int64` 또는 `float64`)으로 변환하여 반환하는 `Evaluate` 함수를 구현합니다.

**이행 절차:**

1.  **정수 파싱 테스트 케이스 작성:**
    *   작업: `interpreter/interpreter_test.go`에 `TestEvaluateIntegerLiterals`라는 테스트 함수를 추가합니다. 이 함수는 다음 케이스들을 포함해야 합니다:
        *   `"123"` 입력 시 `int64(123)`과 `nil` 에러 반환
        *   `"0"` 입력 시 `int64(0)`과 `nil` 에러 반환
        *   `"-5"` 입력 시 `int64(-5)`와 `nil` 에러 반환
        *   `"9223372036854775807"` (max int64) 입력 시 `int64(9223372036854775807)`과 `nil` 에러 반환
        *   `"-9223372036854775808"` (min int64) 입력 시 `int64(-9223372036854775808)`과 `nil` 에러 반환
    *   확인: 테스트 케이스가 `Evaluate` 함수의 예상 동작을 정확히 명시하는지 확인합니다.
2.  **`Evaluate` 함수 기본 틀 작성:**
    *   작업: `interpreter/interpreter.go`에 `Evaluate(expression string) (interface{}, error)` 시그니처를 가진 함수를 정의합니다. 초기 구현은 `nil, nil` 또는 간단한 에러를 반환하도록 합니다.
    *   확인: 함수 시그니처가 올바른지 확인합니다.
3.  **정수 파싱 테스트 실행 (실패 확인):**
    *   작업: `cd interpreter && go test` 명령으로 테스트를 실행합니다.
    *   확인: `TestEvaluateIntegerLiterals`의 모든 케이스가 실패하는지 확인합니다 (아직 구현이 없으므로).
4.  **정수 파싱 로직 구현:**
    *   작업: `Evaluate` 함수 내에서 `strconv.ParseInt`를 사용하여 입력 문자열을 `int64`로 변환하는 로직을 추가합니다. 변환 성공 시 해당 값과 `nil` 에러를, 실패 시 `0`과 에러를 반환합니다.
    *   확인: `strconv.ParseInt`의 사용법(base 10, 64비트 크기 지정)이 올바른지 확인합니다.
5.  **정수 파싱 테스트 실행 (성공 확인):**
    *   작업: `cd interpreter && go test` 명령으로 테스트를 다시 실행합니다.
    *   확인: `TestEvaluateIntegerLiterals`의 모든 케이스가 성공하는지 확인합니다.
6.  **실수 파싱 테스트 케이스 작성:**
    *   작업: `interpreter/interpreter_test.go`에 `TestEvaluateFloatLiterals`라는 테스트 함수를 추가합니다. 이 함수는 다음 케이스들을 포함해야 합니다:
        *   `"3.14"` 입력 시 `float64(3.14)`와 `nil` 에러 반환
        *   `"-0.5"` 입력 시 `float64(-0.5)`와 `nil` 에러 반환
        *   `"0.0"` 입력 시 `float64(0.0)`과 `nil` 에러 반환
        *   `"123.0"` 입력 시 `float64(123.0)`과 `nil` 에러 반환 (정수 형태의 실수)
    *   확인: 테스트 케이스가 실수 값과 부동소수점 정밀도 문제를 고려하여 (필요시 근사값 비교) 작성되었는지 확인합니다.
7.  **실수 파싱 테스트 실행 (실패 확인):**
    *   작업: `cd interpreter && go test` 명령으로 테스트를 실행합니다.
    *   확인: `TestEvaluateFloatLiterals`의 모든 케이스가 실패하는지 확인합니다 (정수 파싱 로직만 존재하므로).
8.  **실수 파싱 로직 구현:**
    *   작업: `Evaluate` 함수를 수정합니다. 먼저 문자열에 `.` (소수점)이 포함되어 있는지 확인합니다. 포함되어 있다면 `strconv.ParseFloat`를 사용하여 `float64`로 변환합니다. 소수점이 없다면 기존의 정수 파싱 로직을 따릅니다.
    *   확인: `strconv.ParseFloat`의 사용법(64비트 크기 지정)이 올바른지, 정수와 실수를 구분하는 로직이 적절한지 확인합니다.
9.  **모든 숫자 리터럴 테스트 실행 (성공 확인):**
    *   작업: `cd interpreter && go test` 명령으로 테스트를 다시 실행합니다.
    *   확인: `TestEvaluateIntegerLiterals`와 `TestEvaluateFloatLiterals`의 모든 케이스가 성공하는지 확인합니다.
