# CORE RUNTIME

Heart of the language. Published as `@dalbit-yaksok/core` on JSR.

## PIPELINE

```
Source Code → tokenize() → parse() → execute()
     ↓            ↓           ↓          ↓
   string      Token[]      Node[]    ValueType
```

## STRUCTURE

```
core/
├── prepare/           # Source → AST
│   ├── tokenize/      # Regex-based tokenization
│   ├── lex/           # Token → initial Node mapping
│   └── parse/         # Multi-stage parsing (indent→bracket→rules)
├── node/              # AST node types (20 files)
├── executer/          # AST execution + Scope management
├── value/             # Runtime value types
├── error/             # YaksokError hierarchy (15 types)
├── extension/         # FFI interface
├── session/           # YaksokSession API
├── type/              # CodeFile, Position
├── constant/          # Reserved words, feature flags
└── util/              # Converters, autocomplete
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| New statement type | `node/` + `prepare/parse/rule/` |
| New operator | `node/operator.ts` (587L) |
| Value type | `value/` (extend ValueType) |
| Error handling | `error/` (extend YaksokError) |
| Session config | `session/session-config.ts` |
| Parsing rules | `prepare/parse/rule/index.ts` (900L) |

## KEY ABSTRACTIONS

### Node Hierarchy
```
Node (base)
├── Executable (has execute())
│   ├── Block, IfStatement, Loop, SetVariable
│   └── Evaluable (has execute() returns ValueType)
│       ├── Identifier, Operator, Expression
│       └── FunctionInvoke
└── DeclareFunction (declaration, not executable)
```

### Value Hierarchy
```
ValueType (base)
├── PrimitiveValue
│   ├── StringValue, NumberValue, BooleanValue
└── ObjectValue
    ├── ListValue (IndexedValue)
    ├── FunctionObject
    └── FFIObject
```

### Parsing Stages
1. `tokenize()` - Regex rules → Token[]
2. `convertTokensToNodes()` - Token → initial AST
3. `parse()` - Multi-pass: dynamic rules → indent → bracket → reduce

## COMPLEXITY HOTSPOTS

| File | Lines | Why Complex |
|------|-------|-------------|
| `prepare/parse/rule/index.ts` | 900 | All parsing rules, shift-reduce |
| `node/operator.ts` | 587 | All operator implementations |
| `session/session.ts` | 575 | Main API, module management |
| `prepare/tokenize/rules.ts` | 518 | Tokenization regex patterns |

## CONVENTIONS

- Nodes have `friendlyName` for Korean error messages
- Executable nodes implement `execute(scope, params)` async
- Evaluable nodes return `ValueType` from execute
- Errors include position, tokens, resource for precise reporting

## ANTI-PATTERNS

- **DO NOT** create circular dependencies between subdirs
- **DO NOT** add new files without updating `mod.ts` exports
- **AVOID** large switch statements - use node polymorphism
