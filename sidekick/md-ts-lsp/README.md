# md-ts-lsp (Rust, Node 없음)

`Markdown` 펜스 안의 `TypeScript` 스니펫을 검사해서 `Zed`에 보여주는 `LSP` 프록시 서버다.
`Oxc`에 없는 기능(마크다운 펜스 검사)이라 별도 서버로 만들었다. 번들에 포함되지 않는다.

## 구조

```
Zed --Markdown--> md-ts-lsp --TypeScript--> tsc --lsp (TS 7 네이티브)
     md 좌표          좌표 동일 가상 문서        md 좌표
```

핵심 트릭은 좌표 동일 가상 문서다. 임시 `.ts` 파일을 만들 때 코드 줄은
마크다운과 같은 줄 번호·같은 `UTF-16` 열에 오도록 공백으로 패딩하고,
나머지 줄은 비워 둔다. 위치 변환이 필요 없어서 프록시는 `URI` 문자열만
바꾸고 나머지는 그대로 중계한다. 메서드별 핸들 작업이 없다.

- 추출: `oxc-markdown-parser` (`ts|tsx|typescript|mts|cts`, 닫히지 않은 펜스는 타이핑 중으로 보고 제외)
- 임시 파일: `<worktree>/.md-ts-lsp/<문서>-<해시>/fence{i}.ts(x)` (프로젝트 `tsconfig` 프로그램에 편입됨)
- 백엔드: `bin/tsc` (`@typescript/linux-x64@7.0.2` 동봉 네이티브 실행파일, `node` 불필요)
- 진단: 변경 후 300ms 디바운스 → 백엔드 `pull` → `publishDiagnostics` 발행. 클라이언트 `pull`에도 캐시로 답한다.

## 설치

```sh
cd sidekick/md-ts-lsp
cargo build        # target/debug/md-ts-lsp
```

`bin/`에는 `tsc`와 타입 라이브러리(`*.d.ts`)가 들어 있다 (`gitignore`됨, 재구성 시 같은 패키지에서 복사).

`Zed` 익스텐션(`sidekick/md-ts-lsp-zed`, `zed: install dev extension`으로 등록)이
서버를 `--stdio --worktree <root> --tsserver <root>/sidekick/md-ts-lsp/bin/tsc`로 띄운다.
`.zed/settings.json`의 `Markdown.language_servers`에 `md-ts-lsp`가 등록되어 있다.

## 확인

```sh
cargo test            # 단위 + 프록시 e2e (진단·hover·didChange)
```

`docs/src/content/docs/examples/basic-usage.md`를 열면
`const b: number = 'adsf'` 줄(`1`번 줄, `0` 기반)에 `TS2322`가 표시되고,
심볼에 `hover`하면 타입이 보인다.

## 한계

- 각 펜스는 격리 검사한다 (펜스 간 `import` 공유 없음).
- `oxlint --lsp` 경로는 컴파일러 진단을 내보내지 않음이 실측됨. 그래서 임시 실파일 + `tsc --lsp` 자식 프로세스 구조다.
- `go to definition` 등에서 워크트리 밖 위치가 나오면 그대로 전달된다 (변환 불가).
- 비 `ASCII` 위치 계산은 `UTF-16` 근사치다.
