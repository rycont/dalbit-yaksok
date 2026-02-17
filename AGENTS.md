# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-02 **Commit:** f2c1218 **Branch:** main

## OVERVIEW

Korean programming language ("약속" fork) interpreter. Deno workspace with JSR
publishing. Code reads like natural Korean sentences with particle conjugations.

## STRUCTURE

```
dalbit-yaksok/
├── core/                  # Runtime: tokenizer→parser→executer (JSR: @dalbit-yaksok/core)
├── test/                  # .yak fixtures + .test.ts files
├── docs/                  # VitePress documentation (Korean)
├── monaco-language-provider/  # Editor syntax highlighting
├── quickjs/               # JavaScript FFI via WASM
├── pyodide/               # Python FFI via WASM
├── mcp-server/            # Cloudflare Worker for AI integration
├── react-demo/            # Demo app (npm-based, not Deno)
└── data-analyze/          # Virtual data utilities
```

## WHERE TO LOOK

| Task                 | Location                            | Notes                         |
| -------------------- | ----------------------------------- | ----------------------------- |
| Add language feature | `core/node/`, `core/prepare/parse/` | New AST node + parsing rule   |
| Fix parsing bug      | `core/prepare/parse/rule/index.ts`  | 900-line rule definitions     |
| Add error type       | `core/error/`                       | Extend YaksokError            |
| Add FFI runtime      | `core/extension/extension.ts`       | Implement Extension interface |
| Write tests          | `test/codes/*.yak` + `*.yak.out`    | Fixture pairs auto-run        |
| Editor features      | `monaco-language-provider/`         | AST-based colorization        |

## CONVENTIONS

### Code Style (Prettier enforced)

- Use Prettier as the canonical formatter for this repository.
- No semicolons
- Single quotes
- 4-space indentation
- Trailing commas everywhere

### Deno Workspace

- Each subdir has own `deno.json` with version
- `mod.ts` = entry point (Deno convention)
- `index.ts` = submodule aggregation
- JSR publishing, NOT npm (except mcp-server, react-demo)

### Circular Dependencies

- Enforced via Madge in CI
- Type-only imports skipped in analysis (`.madgerc`)

### Testing Convention

- `.yak` file + `.yak.out` = integration test pair
- `*.test.ts` = unit tests with `Deno.test()`
- Korean test names acceptable

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use npm for core packages (use JSR)
- **DO NOT** add circular dependencies (CI will fail)
- **AVOID** modifying `core/prepare/parse/rule/index.ts` without understanding
  shift-reduce parser

## COMMANDS

```bash
# Test everything
deno task nested-test

# Test specific module
deno task test              # in subdir

# Check circular deps
deno task check-circular-dependencies

# Format
npx prettier --write .

# Lint
deno lint

# Publish (CI does this)
deno task publish
```

## EXTENSION SYSTEM

FFI via `번역` (translation) keyword:

```typescript
interface Extension {
    manifest: ExtensionManifest // { ffiRunner: { runtimeName: "..." } }
    init?(): Promise<void>
    executeFFI(
        code: string,
        args: FunctionInvokingParams,
        scope: Scope,
    ): ValueType
}
```

Existing: QuickJS (JS), Pyodide (Python)

## NOTES

- Version sync: `deno task apply-version` propagates root version to all
  packages
- Large files: `rule/index.ts` (900L), `session.ts` (575L), `operator.ts`
  (587L) - complexity hotspots
- Korean identifiers: Variables/functions use Korean names (e.g., `보여주기` =
  print)
- Particle handling: `이/가`, `을/를`, `와/과` conjugations in function
  declarations
