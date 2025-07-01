# 달빛약속 실용 튜토리얼

안녕하세요! 이 문서는 달빛약속 프로그래밍 언어의 코드베이스에 새로운 기능을 추가하거나 기존 기능을 수정하고자 하는 개발자들을 위한 실용적인 튜토리얼 시리즈입니다. 각 튜토리얼은 특정 시나리오를 중심으로 단계별 지침과 코드 예시를 제공하여, 달빛약속의 내부 작동 방식을 이해하고 실제 기여를 시작하는 데 도움을 드리는 것을 목표로 합니다.

달빛약속의 전반적인 아키텍처와 핵심 구성 요소에 대한 이해가 부족하다면, 먼저 [기여자 가이드](../CONTRIBUTING_GUIDE.md) 및 [`core/` 디렉토리 상세 문서](../core/overview.md)들을 읽어보시는 것이 좋습니다.

## 튜토리얼 1: 새로운 문법 추가하기 - `증가시키기 <변수이름>` 문

이 튜토리얼에서는 달빛약속에 새로운 문(statement)인 `증가시키기 <변수이름>`을 추가하는 전체 과정을 안내합니다. 이 문은 지정된 숫자 변수의 값을 1만큼 증가시키는 간단한 기능을 수행합니다.

**최종 목표 예시 코드:**

```yak
숫자변수: 10
증가시키기 숫자변수
보여주기 숫자변수 // 화면에 11이 출력되어야 함

다른숫자: -1
증가시키기 다른숫자
보여주기 다른숫자 // 화면에 0이 출력되어야 함
```

이 튜토리얼을 통해 다음을 배우게 됩니다:

*   새로운 키워드에 대한 토큰 정의하기
*   새로운 문법을 위한 AST 노드 클래스 설계 및 구현하기
*   새로운 문법을 파싱하기 위한 규칙 추가하기
*   AST 노드의 실행 및 유효성 검사 로직 작성하기
*   새로운 기능에 대한 테스트 코드 작성하기

자, 시작해봅시다!

### 1부: 준비 및 계획

#### 1.1. 문법 상세 정의 및 요구사항 분석

새로운 문법을 추가하기 전에, 그 형태와 동작, 그리고 예외 상황을 명확히 정의하는 것이 중요합니다.

*   **문법 형태**: `증가시키기 <식별자>`
    *   `증가시키기`는 새로운 키워드입니다.
    *   `<식별자>`는 값을 증가시킬 대상 변수의 이름입니다.
*   **주요 동작**:
    *   `<식별자>`로 지정된 변수는 반드시 **숫자(Number)** 타입이어야 합니다.
    *   해당 변수의 현재 값에 1을 더한 후, 그 결과를 다시 변수에 할당합니다.
    *   이 문(statement) 자체는 어떤 값도 반환하지 않습니다 (표현식(expression)이 아님).
*   **오류 처리 시나리오**:
    1.  `<식별자>`가 현재 스코프에 정의되어 있지 않은 경우: `NotDefinedIdentifierError` (또는 유사한 오류) 발생.
    2.  `<식별자>`가 존재하지만 숫자 타입이 아닌 변수를 참조하는 경우 (예: 문자열, 리스트): `TypeError` (또는 "숫자 타입이 아닙니다"와 같은 사용자 정의 오류) 발생.

### 2부: 토큰(Token) 정의하기

소스 코드는 먼저 토큰이라는 작은 의미 단위로 분해됩니다. `증가시키기`라는 새로운 키워드를 인식시키려면 새 토큰 타입을 정의하고, 토크나이저가 이 키워드를 해당 토큰 타입으로 변환하도록 규칙을 추가해야 합니다.

#### 2.1. `TOKEN_TYPE` 열거형에 새 타입 추가

*   **파일**: `core/prepare/tokenize/token.ts`
*   **변경 내용**: `TOKEN_TYPE` 열거형에 `KEYWORD_INCREMENT`와 같은 새 멤버를 추가합니다.

```typescript
// core/prepare/tokenize/token.ts

export enum TOKEN_TYPE {
    // ... 기존 여러 토큰 타입들 ...

    KEYWORD_PRINT = 'KEYWORD_PRINT', // 보여주기
    // ...
    KEYWORD_INCREMENT = 'KEYWORD_INCREMENT', // "증가시키기" (새로 추가)
    // ...
}
```
*   **설명**: `TOKEN_TYPE`은 달빛약속에서 사용될 수 있는 모든 종류의 토큰을 정의합니다. 여기에 새 타입을 추가함으로써, 이후 파서나 다른 부분에서 이 토큰을 명시적으로 참조할 수 있게 됩니다.

#### 2.2. 토큰화 규칙(`RULES`)에 새 규칙 추가

*   **파일**: `core/prepare/tokenize/rules.ts`
*   **변경 내용**: `RULES` 배열에 `증가시키기` 문자열을 `TOKEN_TYPE.KEYWORD_INCREMENT`로 매칭시키는 새 규칙 객체를 추가합니다.

```typescript
// core/prepare/tokenize/rules.ts
import { TOKEN_TYPE, type Token } from './token.ts'
import { NotAcceptableSignal } from './signal.ts'
// ... 다른 import 문들 ...

export const RULES: {
    type: TOKEN_TYPE
    starter: string | RegExp | string[]
    parse: (
        view: () => string | undefined,
        shift: () => string | undefined,
        tokens: Token[], // 이전 토큰들 (문맥 의존적 토큰화에 사용 가능)
    ) => unknown // 토큰의 'value' 속성에 저장될 값
}[] = [
    // ... 기존 규칙들 (주석, 공백, 연산자, 리터럴 등) ...

    // 키워드는 보통 식별자 규칙보다 먼저 와야 합니다.
    // 그렇지 않으면 '증가시키기'가 일반 식별자로 잘못 인식될 수 있습니다.
    {
        type: TOKEN_TYPE.KEYWORD_INCREMENT,
        starter: '증', // '증가시키기'의 시작 문자
        parse: (view, shift) => {
            const keyword = '증가시키기'
            let consumed = ''
            // '증가시키기' 전체를 정확히 소비하는지 확인
            for (let i = 0; i < keyword.length; i++) {
                if (view() === keyword[i]) {
                    consumed += shift()
                } else {
                    // 현재 규칙이 아님 (예: '증'으로 시작하지만 다른 단어)
                    // 소비한 문자가 있다면 롤백해야 하지만,
                    // 달빛약속 Tokenizer는 성공 시에만 최종 반영하므로 여기서 NotAcceptableSignal만 발생.
                    throw new NotAcceptableSignal()
                }
            }

            // 키워드 바로 뒤에 다른 문자(알파벳, 숫자, 한글)가 붙어 다른 단어가 되는 것을 방지
            // 예: "증가시키기값" 같은 경우를 걸러내야 함.
            const nextChar = view()
            if (nextChar && nextChar.match(/[a-zA-Z0-9_가-힣ㄱ-ㅎㅏ-ㅣ]/)) {
                throw new NotAcceptableSignal()
            }
            return consumed // 토큰의 값으로 실제 키워드 문자열을 저장
        },
    },

    // ... IDENTIFIER (식별자) 규칙 및 기타 규칙들 ...
]
```
*   **설명**:
    *   `starter`: 토크나이저가 이 규칙을 시도해볼지 결정하는 시작 문자(들) 또는 정규식입니다. 여기서는 '증'으로 시작하는 경우 이 규칙을 검토합니다.
    *   `parse(view, shift)`: 실제 파싱 로직입니다.
        *   `view()`: 현재 위치의 문자를 확인합니다 (소비하지 않음).
        *   `shift()`: 현재 문자를 소비하고 다음 문자로 이동합니다. 소비된 문자를 반환합니다.
        *   이 함수는 `증가시키기`라는 문자열 전체를 정확히 소비하고, 그 과정에서 다른 단어의 일부가 아니라는 것을 (경계 조건 확인) 검증해야 합니다.
        *   성공하면 토큰의 `value`가 될 값을 반환하고 (여기서는 키워드 자체), 실패하면 (즉, 현재 스트림이 이 규칙에 맞지 않으면) `NotAcceptableSignal`을 발생시켜 토크나이저가 다른 규칙을 시도하도록 합니다.
    *   **중요**: 키워드 규칙은 보통 일반적인 식별자(Identifier) 규칙보다 `RULES` 배열에서 먼저 정의되어야 합니다. 그렇지 않으면 `증가시키기`가 하나의 긴 식별자로 잘못 해석될 수 있습니다.

### 3부: AST(추상 구문 트리) 노드 정의하기

토큰화 다음 단계는 파싱이며, 파싱의 결과물은 AST입니다. `증가시키기 <변수이름>` 문을 AST에서 표현할 새로운 노드 클래스가 필요합니다.

#### 3.1. 새 AST 노드 파일 생성 및 클래스 정의

*   **새 파일 생성**: `core/node/IncrementStatement.ts` (또는 유사한 작명 규칙 따름)
*   **클래스 정의**:
    *   이 문은 실행 가능한 동작을 나타내므로, `Executable` 기본 클래스를 상속받아야 합니다.
    *   생성자는 증가시킬 대상 변수를 나타내는 `Identifier` 노드를 인자로 받아야 합니다.

```typescript
// core/node/IncrementStatement.ts
import { Executable, Identifier } from './base.ts'
import { Scope } from '../executer/scope.ts'
import { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'
import { YaksokError } from '../error/common.ts'
import { NotDefinedIdentifierError, VariableTypeError } from '../error/variable.ts'
import { Token } from '../prepare/tokenize/token.ts'

export class IncrementStatement extends Executable {
    static override friendlyName = '증가시키기 문' // 디버깅용 이름

    // 생성자: '증가시키기' 키워드 토큰과 대상 변수의 Identifier 노드를 받음
    constructor(
        public keywordToken: Token, // '증가시키기' 키워드 자체의 토큰 정보 (위치 등)
        public identifier: Identifier, // 증가시킬 변수를 나타내는 Identifier 노드
    ) {
        super()
        // 이 노드를 구성하는 주요 토큰들을 설정 (오류 보고 시 위치 정보로 활용)
        this.tokens = [keywordToken, ...identifier.tokens]
        this.position = keywordToken.position // 문의 시작 위치
    }

    /**
     * IncrementStatement 노드의 실행 로직
     * 1. 스코프에서 변수 값을 가져온다.
     * 2. 변수가 존재하고 숫자인지 확인한다.
     * 3. 값을 1 증가시키고 스코프에 다시 저장한다.
     * 4. 오류 발생 시 적절한 오류를 던진다.
     */
    override async execute(scope: Scope): Promise<ValueType | null> {
        const varName = this.identifier.value // 변수 이름

        // 1. 스코프에서 변수 값 가져오기
        let variableValue: ValueType
        try {
            variableValue = scope.getVariable(varName)
        } catch (e) {
            // 변수가 정의되지 않은 경우
            if (e instanceof NotDefinedIdentifierError) {
                e.tokens = this.identifier.tokens // 오류에 토큰 위치 정보 추가
                throw e
            }
            throw e // 기타 예외
        }

        // 2. 변수가 숫자인지 확인
        if (!(variableValue instanceof NumberValue)) {
            throw new VariableTypeError({
                message: `"${varName}" 변수는 숫자 타입이 아니므로 증가시킬 수 없습니다 (현재 타입: ${variableValue.constructor.name}).`,
                tokens: this.identifier.tokens,
                variableName: varName,
                expectedType: NumberValue.friendlyName,
                actualType: (variableValue.constructor as typeof ValueType).friendlyName || '알 수 없음',
            })
        }

        // 3. 값을 1 증가시키고 스코프에 다시 저장
        const currentValue = variableValue.value
        const newValue = new NumberValue(currentValue + 1)
        scope.setVariable(varName, newValue) // 변수 값 업데이트

        return null // 이 문은 값을 반환하지 않음
    }

    /**
     * IncrementStatement 노드의 유효성 검사 로직
     * (정적 분석 단계에서 호출될 수 있음)
     * 1. 대상 식별자가 스코프에 정의되어 있는지 확인한다.
     * 2. 정의되어 있다면, 해당 변수가 숫자 타입인지 확인한다.
     */
    override validate(scope: Scope): YaksokError[] {
        const errors: YaksokError[] = []
        const varName = this.identifier.value

        try {
            const valueAtValidation = scope.getVariable(varName)
            if (!(valueAtValidation instanceof NumberValue)) {
                errors.push(
                    new VariableTypeError({
                        message: `"${varName}" 변수는 숫자 타입이어야 "증가시키기"를 사용할 수 있습니다.`,
                        tokens: this.identifier.tokens,
                        variableName: varName,
                        expectedType: NumberValue.friendlyName,
                        actualType: (valueAtValidation.constructor as typeof ValueType).friendlyName || '알 수 없음',

                    }),
                )
            }
        } catch (e) {
            // 변수가 정의되지 않은 경우
            if (e instanceof NotDefinedIdentifierError) {
                e.tokens = this.identifier.tokens
                errors.push(e)
            } else if (e instanceof YaksokError) {
                // 기타 YaksokError (예: VariableTypeError가 아닌 다른 타입 문제)
                errors.push(e)
            } else {
                // 예상치 못한 시스템 오류는 그대로 던짐
                throw e
            }
        }
        return errors
    }

    // 디버깅 또는 AST 시각화 시 사용될 수 있는 문자열 표현
    override toPrint(): string {
        return `${this.keywordToken.value} ${this.identifier.toPrint()}`
    }
}
```
*   **설명**:
    *   `constructor`: `증가시키기` 키워드 토큰과 대상 변수를 나타내는 `Identifier` 노드를 받습니다. `tokens`와 `position`은 오류 보고나 디버깅 시 정확한 위치를 가리키는 데 사용됩니다.
    *   `execute(scope: Scope)`: 이 노드가 실행될 때 호출되는 메소드입니다.
        *   스코프에서 변수 값을 가져옵니다.
        *   변수가 `NumberValue`인지 확인합니다. 아니면 `VariableTypeError`를 발생시킵니다.
        *   숫자 값을 1 증가시켜 새로운 `NumberValue`를 만들고, 스코프에 변수 값을 업데이트합니다.
        *   이 문은 값을 반환하지 않으므로 `null`을 반환합니다.
    *   `validate(scope: Scope)`: (선택적이지만 권장됨) 정적 분석 단계에서 호출되어, 코드를 실행하기 전에 잠재적인 오류를 찾습니다. `execute`와 유사한 검사를 수행하지만 실제 값을 변경하지는 않습니다. 발견된 오류들을 배열로 반환합니다.
    *   `toPrint()`: 디버깅이나 AST를 문자열로 표현할 때 사용됩니다.

#### 3.2. 새 AST 노드 익스포트

*   **파일**: `core/node/index.ts`
*   **변경 내용**: 새로 만든 `IncrementStatement` 클래스를 다른 모듈에서 임포트할 수 있도록 익스포트 목록에 추가합니다.

```typescript
// core/node/index.ts
// ... 다른 노드들의 export ...
export * from './IfStatement.ts'
export * from './function.ts'
// ...
export * from './IncrementStatement.ts' // 새로 추가
```

### 4부: 파싱(Parsing) 규칙 추가하기

이제 토크나이저가 `증가시키기` 키워드를 인식하고, `IncrementStatement` AST 노드도 준비되었습니다. 다음은 파서가 `KEYWORD_INCREMENT IDENTIFIER` 토큰 시퀀스를 만나면 `IncrementStatement` 노드를 생성하도록 파싱 규칙을 추가하는 것입니다.

달빛약속은 Shift-Reduce 파서를 사용하며, 규칙은 `core/prepare/parse/rule.ts` 파일에 정의되어 있습니다.

#### 4.1. 파싱 규칙 정의

*   **파일**: `core/prepare/parse/rule.ts`
*   **변경 내용**: `BASIC_RULES` 또는 `ADVANCED_RULES` 배열 (문맥과 우선순위에 따라 적절한 위치)에 새 규칙 객체를 추가합니다. `증가시키기` 문은 비교적 간단한 문이므로 `BASIC_RULES`의 적절한 레벨에 추가하는 것을 고려할 수 있습니다.

```typescript
// core/prepare/parse/rule.ts
// ... 다른 import 문들 ...
import { TOKEN_TYPE } from '../tokenize/token.ts' // TOKEN_TYPE 임포트
import { Identifier } from '../../node/base.ts' // Identifier 노드 임포트
import { IncrementStatement } from '../../node/IncrementStatement.ts' // 새로 만든 노드 임포트
import { Rule, RULE_FLAGS } from './type.ts' // Rule 타입과 RULE_FLAGS 임포트

// ... 기존 규칙 정의 ...

// BASIC_RULES는 여러 레벨의 규칙 배열로 구성될 수 있습니다.
// 각 내부 배열은 특정 우선순위 레벨의 규칙들을 나타냅니다.
// IncrementStatement는 독립적인 문(statement)이므로, 보통 다른 표현식 규칙들과 분리된 레벨에 있거나,
// 문을 처리하는 특정 규칙 그룹에 속하게 됩니다.
export const BASIC_RULES: Rule[][] = [
    // ... 기존 여러 레벨의 규칙들 ...
    [
        // 이 레벨에 다른 문(statement) 관련 규칙들이 있을 수 있습니다.
        // ...
        {
            // 패턴: "증가시키기" 키워드 토큰 다음에 Identifier 노드가 오는 경우
            pattern: [TOKEN_TYPE.KEYWORD_INCREMENT, Identifier],
            // 팩토리 함수: 패턴에 매칭된 노드/토큰들로부터 새로운 AST 노드를 생성
            factory: (nodes: [Token, Identifier]): IncrementStatement => {
                // nodes[0]은 KEYWORD_INCREMENT 타입의 Token 객체
                // nodes[1]은 Identifier 타입의 AST Node 객체
                // IncrementStatement 생성자에는 Token 객체와 Identifier 노드가 필요
                return new IncrementStatement(nodes[0], nodes[1])
            },
            // 플래그: 이 규칙이 독립적인 문(statement)을 형성함을 나타냄
            flags: [RULE_FLAGS.IS_STATEMENT],
        },
        // ... 이 레벨의 다른 규칙들 ...
    ],
    // ... 기존 여러 레벨의 규칙들 ...
]

// ADVANCED_RULES도 유사한 구조를 가집니다.
// export const ADVANCED_RULES: Rule[][] = [ /* ... */ ];
```
*   **설명**:
    *   `import`: 필요한 `TOKEN_TYPE`, `Identifier` 노드, 그리고 새로 만든 `IncrementStatement` 노드를 임포트합니다.
    *   `pattern: [TOKEN_TYPE.KEYWORD_INCREMENT, Identifier]`: 파서가 찾을 토큰/노드 시퀀스입니다.
        *   `TOKEN_TYPE.KEYWORD_INCREMENT`: `증가시키기` 키워드에 해당하는 토큰 타입입니다.
        *   `Identifier`: 이미 파싱되어 `Identifier` AST 노드로 변환된 대상 변수입니다. (파서는 점진적으로 복잡한 구조를 만들어가므로, `Identifier`와 같은 기본 단위는 이미 다른 규칙에 의해 노드로 변환되었을 수 있습니다.)
    *   `factory: (nodes: [Token, Identifier]): IncrementStatement => { ... }`: `pattern`이 성공적으로 매칭되면 호출되는 함수입니다.
        *   `nodes` 매개변수는 `pattern`에 매칭된 실제 `Token` 또는 `Node` 객체들의 배열입니다. 타입스크립트 튜플 타입 `[Token, Identifier]`로 구체화하여 각 요소의 타입을 명시할 수 있습니다.
        *   `IncrementStatement`의 새 인스턴스를 생성하여 반환합니다. 이때 `nodes[0]` (키워드 토큰)과 `nodes[1]` (Identifier 노드)을 생성자에 전달합니다.
    *   `flags: [RULE_FLAGS.IS_STATEMENT]`: 이 규칙이 독립적인 문(statement)으로 처리되어야 함을 나타냅니다. 이는 파서가 특정 문맥(예: 줄의 시작이나 끝, 블록의 직접적인 자식 등)에서만 이 규칙을 적용하도록 돕는 힌트가 될 수 있습니다.

### 5부: 테스트 작성하기

새로운 기능을 추가한 후에는 반드시 테스트를 작성하여 기능이 의도대로 정확히 작동하는지, 그리고 다양한 예외 상황을 잘 처리하는지 확인해야 합니다.

#### 5.1. 성공 케이스 테스트

*   **파일 위치**: `test/codes/` 디렉토리 아래에 테스트 파일 추가 (예: `increment_statement.yak`)
*   **내용**: `증가시키기` 문이 올바르게 변수 값을 증가시키는지 확인하는 코드.

```yak
// test/codes/increment_statement.yak

숫자변수: 10
보여주기 "초기값:", 숫자변수 // 초기값: 10

증가시키기 숫자변수
보여주기 "1 증가 후:", 숫자변수 // 1 증가 후: 11

증가시키기 숫자변수
증가시키기 숫자변수
보여주기 "추가 2 증가 후:", 숫자변수 // 추가 2 증가 후: 13

음수테스트: -2
증가시키기 음수테스트
보여주기 "음수 증가 후:", 음수테스트 // 음수 증가 후: -1
```

*   **예상 출력 파일**: `test/codes/increment_statement.yak.out`

```
초기값: 10
1 증가 후: 11
추가 2 증가 후: 13
음수 증가 후: -1
```
*   **실행**: 프로젝트의 테스트 실행 스크립트(예: `deno test runtest.ts` 또는 유사한 명령)를 사용하여 이 테스트를 포함한 전체 테스트를 실행합니다.

#### 5.2. 오류 케이스 테스트

정의되지 않은 변수나 잘못된 타입의 변수를 증가시키려고 할 때 예상된 오류가 발생하는지 확인하는 테스트도 중요합니다.

*   **파일 위치**: `test/errors/` 디렉토리 아래에 테스트 파일 추가 (예: `increment_errors.test.ts`)
*   **내용**: `try...catch` 또는 특정 테스트 유틸리티를 사용하여 오류 발생을 확인하는 Deno 테스트 케이스.

```typescript
// test/errors/increment_errors.test.ts
import { assertEquals, assertRejects } from 'https://deno.land/std/assert/mod.ts'
import { yaksok } from '../../core/mod.ts' // 달빛약속 실행 함수
import {
    NotDefinedIdentifierError,
    VariableTypeError,
} from '../../core/error/variable.ts'

Deno.test('[Increment Error] 정의되지 않은 변수 증가 시 NotDefinedIdentifierError 발생', async () => {
    const code = `
        증가시키기 없는변수
    `
    await assertRejects(
        async () => {
            await yaksok(code)
        },
        NotDefinedIdentifierError,
        // 선택적으로 오류 메시지 내용도 확인할 수 있습니다.
        // '식별자 "없는변수"가 정의되지 않았습니다.' (실제 오류 메시지에 맞춰야 함)
    )
})

Deno.test('[Increment Error] 문자열 변수 증가 시 VariableTypeError 발생', async () => {
    const code = `
        문자변수: "안녕"
        증가시키기 문자변수
    `
    await assertRejects(
        async () => {
            await yaksok(code)
        },
        VariableTypeError,
        // '변수는 숫자 타입이 아니므로 증가시킬 수 없습니다' (실제 오류 메시지에 맞춰야 함)
    )
})

Deno.test('[Increment Error] 리스트 변수 증가 시 VariableTypeError 발생', async () => {
    const code = `
        리스트변수: [1, 2, 3]
        증가시키기 리스트변수
    `
    await assertRejects(
        async () => {
            await yaksok(code)
        },
        VariableTypeError,
    )
})
```
*   **설명**:
    *   `assertRejects`: Deno 표준 라이브러리의 단언(assertion) 함수로, 특정 비동기 함수가 예상된 타입의 오류를 발생시키는지 검증합니다.
    *   각 테스트 케이스는 `증가시키기` 문이 잘못 사용되었을 때, 우리가 `IncrementStatement` 노드의 `execute` 메소드에서 정의한 대로 올바른 오류 타입(`NotDefinedIdentifierError`, `VariableTypeError`)이 발생하는지 확인합니다.

### 6부: 최종 검토 및 추가 고려사항

여기까지 `증가시키기` 문을 추가하는 기본적인 과정을 모두 마쳤습니다. 실제 기여 시에는 다음 사항들도 추가로 고려해보세요.

*   **들여쓰기 및 문맥**: 만약 새로운 문법이 특정 들여쓰기 레벨이나 다른 문법적 문맥 안에서만 유효하다면, 파싱 규칙(`rule.ts`)이나 `parse-indent.ts`에서의 처리가 더 복잡해질 수 있습니다.
*   **다른 기능과의 상호작용**: 새로 추가한 기능이 기존의 다른 언어 기능들(예: 함수, 조건문, 반복문)과 어떻게 상호작용하는지, 예기치 않은 문제는 없는지 확인해야 합니다.
*   **성능**: 매우 자주 호출될 수 있는 기능을 추가한다면, 성능에 미치는 영향도 고려해야 할 수 있습니다. (하지만 보통은 기능 구현과 정확성 확보가 우선입니다.)
*   **문서화**:
    *   **사용자 문서**: 새로운 문법에 대한 사용법, 예시 등을 사용자 문서에 추가해야 합니다.
    *   **개발자 문서 (이 튜토리얼과 같은)**: 만약 새로운 문법 추가 과정이 다른 개발자들에게 참고가 될 만한 특별한 패턴이나 복잡성을 가졌다면, 관련 개발자 문서를 업데이트하거나 새로운 내용을 추가하는 것을 고려할 수 있습니다.
*   **커뮤니티 피드백**: 가능하다면 Pull Request를 통해 다른 기여자들로부터 코드 리뷰와 피드백을 받는 것이 좋습니다.

---

이 튜토리얼이 달빛약속에 새로운 문법을 추가하는 과정을 이해하는 데 도움이 되었기를 바랍니다. 직접 코드를 수정하고 테스트를 실행해보면서 각 단계의 의미를 더 깊이 파악해보세요! 궁금한 점이나 개선 제안이 있다면 언제든지 프로젝트 이슈 트래커나 커뮤니티를 통해 논의해주세요.
