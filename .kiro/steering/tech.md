# Technology Stack

## Build System & Runtime
- **Primary Runtime**: Deno (TypeScript/JavaScript)
- **Package Manager**: Deno with workspace support
- **Module System**: JSR (JavaScript Registry) for package distribution
- **Node Modules**: Auto-managed via `nodeModulesDir: "auto"`

## Tech Stack
- **Language**: TypeScript
- **Runtime Targets**: Deno, Node.js, Bun (via JSR)
- **Code Formatter**: Prettier
- **Circular Dependency Detection**: Madge
- **Testing**: Deno's built-in test runner
- **Documentation**: VitePress (in docs/)
- **Editor Integration**: Monaco Editor

## Key Libraries
- QuickJS (via quickjs-emscripten) - Lightweight JavaScript engine for FFI
- Pyodide - Python runtime in WebAssembly
- Monaco Editor - Web-based code editor

## Common Commands

### Testing
```bash
# Run all tests in workspace
deno task nested-test

# Run tests for specific module
deno task test

# Check for circular dependencies
deno task check-circular-dependencies
```

### Publishing
```bash
# Apply version to all workspace packages
deno task apply-version

# Publish to JSR (with tests)
deno task publish

# Dry-run publish check
deno publish --dry-run --allow-dirty
```

### Development
```bash
# Run example code
deno run runtest.ts

# Check code formatting
deno fmt --check

# Format code
deno fmt

# Lint code
deno lint
```

## Code Style
- **Formatter**: Prettier with custom config
  - No semicolons
  - Single quotes
  - Trailing commas
  - Tab width: 4 spaces
  - Print width: 80 characters
- **Import Style**: Skip type-only imports in dependency analysis
- **Linting**: Deno recommended rules, excluding `no-explicit-any`
