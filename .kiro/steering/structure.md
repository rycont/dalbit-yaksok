# Project Structure

## Workspace Organization
This is a Deno workspace with multiple packages. Each package has its own `deno.json` with independent versioning.

## Core Directories

### `/core` - Runtime Package
The heart of the language implementation. Published as `@dalbit-yaksok/core` on JSR.

**Architecture layers:**
- `prepare/` - Lexer, tokenizer, and parser (source → AST)
  - `lex/` - Lexical analysis
  - `tokenize/` - Token generation
  - `parse/` - AST construction
- `executer/` - AST execution engine and scope management
- `node/` - AST node type definitions (blocks, loops, functions, etc.)
- `value/` - Value system (primitives, lists, functions, FFI values)
- `session/` - YaksokSession and configuration
- `error/` - Error types and rendering
- `extension/` - FFI extension interface
- `type/` - Core type definitions
- `util/` - Utility functions
- `constant/` - Reserved words and feature flags

**Entry point:** `mod.ts` exports the public API

### `/test` - Test Suite
Contains `.yak` source files and `.yak.out` expected output files for integration testing.
- `codes/` - Test source files
- `errors/` - Error handling tests
- Individual test files for specific features

### `/docs` - Documentation Site
VitePress-based documentation in Korean.
- `.vitepress/` - VitePress configuration
- `guide/` - Developer guides for contributing
- `language/` - Language tutorial
- `library/` - API documentation
- `monaco/` - Monaco Editor integration guide

### `/monaco-language-provider` - Editor Integration
Monaco Editor language service provider. Published as `@dalbit-yaksok/monaco-language-provider`.
- Syntax highlighting via AST-based tokenization
- Autocomplete support
- `ast-to-colorize/` - AST to color token conversion
- `provider/` - Monaco language service providers

### `/quickjs` - JavaScript FFI Bridge
QuickJS integration for safe JavaScript execution. Published as `@dalbit-yaksok/quickjs`.

### `/pyodide` - Python FFI Bridge
Pyodide integration for Python interop.

### `/mcp-server` - MCP Server
Model Context Protocol server for AI assistant integration.

## Key Files

- `deno.json` - Root workspace configuration with version and tasks
- `apply-version.ts` - Script to sync version across workspace packages
- `runtest.ts` - Quick test/example runner
- `.prettierrc` - Code formatting rules
- `.madgerc` - Circular dependency detection config
- `GEMINI.md` - Comprehensive Korean documentation index

## Naming Conventions
- Directories use lowercase with hyphens for multi-word names
- TypeScript files use kebab-case
- Class files may use PascalCase (e.g., `IfStatement.ts`)
- Test files use `.test.ts` suffix
- Yaksok source files use `.yak` extension
- Expected output files use `.yak.out` extension

## Module Dependencies
- Avoid circular dependencies (enforced by Madge in CI)
- Type-only imports are skipped in dependency analysis
- Each workspace package is independently publishable
