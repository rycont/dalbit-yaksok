---
title: "Monaco Editor에서 달빛약속 사용하기"
---

# Monaco Editor에서 달빛약속 사용하기

[Monaco Editor](https://microsoft.github.io/monaco-editor/)는 Microsoft에서 개발한 코드 에디터 컴포넌트입니다. `jsr:@dalbit-yaksok/monaco-language-provider` 패키지는 Monaco Editor에서 문법 강조, 키워드 자동 완성 등의 편의 기능을 제공합니다.

| 기능                              | 상태 |
| --------------------------------- | ---- |
| 문법 강조 (Syntax Highlighting)   | ✅   |
| 키워드 자동 완성 (Autocompletion) | ✅   |
| 툴팁 (Tooltip)                    | ❌   |
| 문법 오류 보기 (Syntax Error)     | ❌   |

## 설치하기

`jsr:@dalbit-yaksok/monaco-language-provider` 패키지를 설치합니다.

```bash
# Deno
deno add jsr:@dalbit-yaksok/monaco-language-provider

# NPM
npx jsr add @dalbit-yaksok/monaco-language-provider

# Yarn
yarn dlx jsr add @dalbit-yaksok/monaco-language-provider

# Pnpm
pnpm dlx jsr add @dalbit-yaksok/monaco-language-provider

# Bun
bunx jsr add @dalbit-yaksok/monaco-language-provider
```

## 사용하기

`@dalbit-yaksok/monaco-language-provider` 패키지를 불러와 Monaco Editor에 적용합니다.

Monaco Editor에서 불러온 languages 객체, editor의 인스턴스가 필요합니다.

```ts{2-5,7-8,11,13}
import { languages, editor } from 'monaco-editor'
import {
    DalbitYaksokApplier,
    LANG_ID,
} from '@dalbit-yaksok/monaco-language-provider'

const languageProvider = new DalbitYaksokApplier(code.value)
languageProvider.register(languages)

const editorInstance = editor.create(element, {
    language: LANG_ID,
})
languageProvider.configEditor(editorInstance)
```
