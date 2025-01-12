(달빛약속의 이전 이름은 yaksok.ts입니다. v0.2 이후부터 달빛약속으로 불립니다.)

# 달빛약속 (Dalbit Yaksok)

한국어 프로그래밍 언어 ["약속"](http://yaksok.org/)의 포크.

[온라인 데모](https://dalbit-yaksok.postica.app)에서 직접 사용할 수 있습니다.

```typescript
import { yaksok } from '@dalbit-yaksok/core'

const code = `
약속, (대상)이여/여 지금 내게 나타나거라
    대상 + " 등장" 보여주기

("숫가락")이여 지금 내게 나타나거라
("포크")여 지금 내게 나타나거라
`

await yaksok(code)
```

## 구성 요소

| 이름                     | 상태 | 주소                                                                                                  | 문서                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ---- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 런타임                   | ✔️   | [jsr:@dalbit-yaksok/core](https://jsr.io/@dalbit-yaksok/core)                                         | [library/1. 시작하기](https://dalbit-yaksok.postica.app/library/1.%20%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0)                                                                                                                                                                                                                                         |
| 문서                     | ✔️   | https://dalbit-yaksok.postica.app                                                                     |                                                                                                                                                                                                                                                                                                                                                    |
| QuickJS 번역 브릿지      | ✔️   | [jsr:@dalbit-yaksok/quickjs](https://jsr.io/@dalbit-yaksok/quickjs)                                   | [library/4.1. 번역: QuickJS를 사용해 자바스크립트로 안전하게 번역하기](https://dalbit-yaksok.postica.app/library/4.1.%20%EB%B2%88%EC%97%AD:%20QuickJS%EB%A5%BC%20%EC%82%AC%EC%9A%A9%ED%95%B4%20%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8%EB%A1%9C%20%EC%95%88%EC%A0%84%ED%95%98%EA%B2%8C%20%EB%B2%88%EC%97%AD%ED%95%98%EA%B8%B0.html) |
| Monaco Language Provider | 🏃   | [jsr:@dalbit-yaksok/monaco-language-provider](https://jsr.io/@dalbit-yaksok/monaco-language-provider) | [monaco/사용 방법](https://dalbit-yaksok.postica.app/monaco/%EC%82%AC%EC%9A%A9%20%EB%B0%A9%EB%B2%95.html)                                                                                                                                                                                                                                          |
