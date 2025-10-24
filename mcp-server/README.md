# 달빛약속 MCP 서버

한국어 프로그래밍 언어 [달빛약속(Dalbit Yaksok)](https://github.com/dalbit-yaksok/dalbit-yaksok)을 실행할 수 있는 MCP(Model Context Protocol) 서버입니다.

## 기능

- ✅ **코드 실행**: 달빛약속 코드를 실시간으로 실행
- ✅ **문법 검증**: 달빛약속 코드의 문법 검사
- ✅ **예제 제공**: 기본적인 사용 예제 코드 제공
- ✅ **웹 UI**: 브라우저에서 간편한 코드 실행 및 테스트
- ✅ **MCP 프로토콜**: 표준 MCP 프로토콜 지원

## 설치 및 실행

### 요구사항

- [Deno](https://deno.com/) 1.0 이상

### 실행

```bash
# MCP 서버 시작
deno run -A main.ts

# 또는
deno task start
```

서버가 시작되면 다음 엔드포인트가 제공됩니다:

- **웹 UI**: http://localhost:3000/
- **MCP 엔드포인트**: http://localhost:3000/mcp
- **건강 상태**: http://localhost:3000/health
- **서버 정보**: http://localhost:3000/info

## MCP 도구

### 1. execute_dalbit_yaksok
달빛약속 코드를 실행합니다.

**파라미터:**
- `code` (string, 필수): 실행할 달빛약속 코드

**예제:**
```json
{
  "code": "약속, \"안녕하세요\" 보여주기"
}
```

### 2. validate_dalbit_yaksok
달빛약속 코드의 문법을 검증합니다.

**파라미터:**
- `code` (string, 필수): 검증할 달빛약속 코드

**예제:**
```json
{
  "code": "이름 = \"달빛\"\n약속, 이름 + \"약속입니다\" 보여주기"
}
```

## 달빛약속 언어 예제

### 기본 출력
```
약속, "안녕하세요" 보여주기
```

### 변수 사용
```
이름 = "달빛"
약속, 이름 + "약속입니다" 보여주기
```

### 조건문
```
만약 5 > 3
    "5는 3보다 큽니다" 보여주기
그렇지 않으면
    "5는 3보다 작습니다" 보여주기
```

### 반복문
```
숫자들 = [1, 2, 3, 4, 5]
숫자들 각각에 대해
    약속, "숫자: " + 숫자들[순번] 보여주기
```

### 함수
```
함수 더하기(첫번째, 두번째)
    결과 = 첫번째 + 두번째
    결과 리턴하기

합계 = 더하기(10, 20)
약속, "합계: " + 합계 보여주기
```

## API 사용법

### HTTP API

#### 코드 실행
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "execute_dalbit_yaksok",
      "arguments": {
        "code": "약속, \"안녕하세요\" 보여주기"
      }
    }
  }'
```

#### 문법 검증
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "validate_dalbit_yaksok",
      "arguments": {
        "code": "약속, \"안녕하세요\" 보여주기"
      }
    }
  }'
```

### 웹 UI 사용

1. 브라우저에서 http://localhost:3000/ 접속
2. 코드 입력 창에 달빛약속 코드 입력
3. "실행" 버튼 클릭으로 코드 실행
4. "검증" 버튼 클릭으로 문법 검사
5. "예제 로드" 버튼으로 예제 코드 불러오기

## 프로젝트 구조

```
mcp-server/
├── src/
│   ├── mcp-server.ts    # MCP 서버 구현
│   └── http-server.ts   # HTTP 서버 (대안)
├── main.ts              # 서버 진입점
├── deno.json           # Deno 설정
└── README.md           # 프로젝트 문서
```

## 라이선스

이 프로젝트는 원본 달빛약속 프로젝트의 라이선스를 따릅니다.

## 관련 프로젝트

- [달빛약속 (Dalbit Yaksok)](https://github.com/dalbit-yaksok/dalbit-yaksok) - 한국어 프로그래밍 언어
- [Hono MCP](https://jsr.io/@hono/mcp) - Hono용 MCP 라이브러리




