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
| 런타임                   | ✔️   | [jsr:@dalbit-yaksok/core](https://jsr.io/@dalbit-yaksok/core)                                         | [library/1. getting-started](https://dalbit-yaksok.postica.app/library/1.%20getting-started)                                                                                                                                                                                                                                                         |
| 문서                     | ✔️   | https://dalbit-yaksok.postica.app                                                                     |                                                                                                                                                                                                                                                                                                                                                    |
| QuickJS 번역 브릿지      | ✔️   | [jsr:@dalbit-yaksok/quickjs](https://jsr.io/@dalbit-yaksok/quickjs)                                   | [library/4.1. quickjs-translation](https://dalbit-yaksok.postica.app/library/4.1.%20quickjs-translation) |
| Monaco Language Provider | 🏃   | [jsr:@dalbit-yaksok/monaco-language-provider](https://jsr.io/@dalbit-yaksok/monaco-language-provider) | [monaco/usage-guide](https://dalbit-yaksok.postica.app/monaco/usage-guide)                                                                                                                                                                                                                                          |
