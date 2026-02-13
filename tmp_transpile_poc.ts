import { YaksokSession } from './core/mod.ts'

type Target = 'js' | 'py'

type AnyNode = any

const opMap: Record<string, string> = {
  PlusOperator: '+',
  MinusOperator: '-',
  MultiplyOperator: '*',
  DivideOperator: '/',
  IntegerDivideOperator: '//',
  ModularOperator: '%',
  PowerOperator: '**',
  EqualOperator: '==',
  NotEqualOperator: '!=',
  GreaterThanOperator: '>',
  LessThanOperator: '<',
  GreaterThanOrEqualOperator: '>=',
  LessThanOrEqualOperator: '<=',
  AndOperator: 'and',
  OrOperator: 'or',
  RangeOperator: '..',
}

class Emitter {
  private indentLevel = 0
  private lines: string[] = []
  private fnNameMap = new Map<string, string>()
  private fnSeq = 0

  constructor(private target: Target) {}

  emitProgram(block: AnyNode): string {
    for (const child of block.children ?? []) this.emitStmt(child)
    return this.lines.join('\n')
  }

  private indent() {
    return '    '.repeat(this.indentLevel)
  }

  private push(line = '') {
    this.lines.push(this.indent() + line)
  }

  private safeFnName(raw: string) {
    if (!this.fnNameMap.has(raw)) this.fnNameMap.set(raw, `yak_fn_${++this.fnSeq}`)
    return this.fnNameMap.get(raw)!
  }

  private emitStmt(node: AnyNode) {
    switch (node?.constructor?.name) {
      case 'EOL':
        return
      case 'SetVariable': {
        const rhs = this.emitExpr(node.value)
        if (node.operator && node.operator !== '=') this.push(`${node.name} ${node.operator} ${rhs}`)
        else this.push(`${node.name} = ${rhs}`)
        return
      }
      case 'Print':
        this.push(`print(${this.emitExpr(node.value)})`)
        return
      case 'IfStatement': {
        node.cases.forEach((c: any, i: number) => {
          const head = this.target === 'py'
            ? (c.condition
              ? i === 0
                ? `if ${this.emitExpr(c.condition)}:`
                : `elif ${this.emitExpr(c.condition)}:`
              : 'else:')
            : (c.condition
              ? `${i === 0 ? 'if' : 'else if'} (${this.emitExpr(c.condition)}) {`
              : 'else {')
          this.push(head)
          this.indentLevel++
          for (const cc of c.body.children ?? []) this.emitStmt(cc)
          if ((c.body.children ?? []).length === 0) this.push(this.target === 'py' ? 'pass' : '// pass')
          this.indentLevel--
          if (this.target === 'js') this.push('}')
        })
        return
      }
      case 'CountLoop': {
        const count = this.emitExpr(node.count)
        this.push(this.target === 'py' ? `for _ in range(int(${count})):` : `for (let __i = 0; __i < Number(${count}); __i++) {`)
        this.indentLevel++
        for (const cc of node.body.children ?? []) this.emitStmt(cc)
        if ((node.body.children ?? []).length === 0) this.push(this.target === 'py' ? 'pass' : '// pass')
        this.indentLevel--
        if (this.target === 'js') this.push('}')
        return
      }
      case 'DeclareFunction': {
        const fn = this.safeFnName(node.name)
        const params = this.extractParams(node.tokens)
        this.push(this.target === 'py' ? `def ${fn}(${params.join(', ')}):` : `function ${fn}(${params.join(', ')}) {`)
        this.indentLevel++
        for (const cc of node.body.children ?? []) this.emitStmt(cc)
        if ((node.body.children ?? []).length === 0) this.push(this.target === 'py' ? 'pass' : '// pass')
        this.indentLevel--
        if (this.target === 'js') this.push('}')
        return
      }
      case 'ReturnStatement':
        this.push(node.value ? `return ${this.emitExpr(node.value)}` : 'return')
        return
      default:
        this.push(`# UNSUPPORTED_STMT: ${node?.constructor?.name}`)
        return
    }
  }

  private emitExpr(node: AnyNode): string {
    switch (node?.constructor?.name) {
      case 'NumberLiteral':
        return String(node.content)
      case 'StringLiteral':
        return JSON.stringify(node.content)
      case 'BooleanLiteral':
        return node.content ? (this.target === 'py' ? 'True' : 'true') : (this.target === 'py' ? 'False' : 'false')
      case 'Identifier':
        return node.value
      case 'ValueWithParenthesis':
        return `(${this.emitExpr(node.value)})`
      case 'Formula':
        return this.emitFormula(node)
      case 'FunctionInvoke': {
        const fn = this.safeFnName(node.name)
        const args = this.extractArgs(node.params)
        return `${fn}(${args.join(', ')})`
      }
      default:
        return `/*UNSUPPORTED_EXPR:${node?.constructor?.name}*/None`
    }
  }

  private emitFormula(node: AnyNode): string {
    // quick PoC: term sequence join (not full precedence reconstruction)
    return node.terms
      .map((t: AnyNode) => {
        const op0 = opMap[t?.constructor?.name]
        if (op0) {
          if (this.target === 'js' && op0 === 'and') return '&&'
          if (this.target === 'js' && op0 === 'or') return '||'
          return op0
        }
        return this.emitExpr(t)
      })
      .join(' ')
  }

  private extractParams(tokens: any[]): string[] {
    const out: string[] = []
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'OPENING_PARENTHESIS' && tokens[i + 1].type === 'IDENTIFIER') out.push(tokens[i + 1].value)
    }
    return Array.from(new Set(out))
  }

  private extractArgs(params: Record<string, AnyNode>): string[] {
    return Object.keys(params)
      .sort()
      .map((k) => this.emitExpr(params[k]))
  }
}

const code = `
약속, (숫자1)와 (숫자2)의 합
    숫자1 + 숫자2 반환하기
합계 = (5)와 (3)의 합
만약 합계 > 7 이면
    "합격" 보여주기
아니면
    "불합격" 보여주기
3번 반복
    합계 보여주기
`

const s = new YaksokSession()
const f = s.addModule('main', code)
const ast = f.ast

const py = new Emitter('py').emitProgram(ast)
const js = new Emitter('js').emitProgram(ast)

console.log('=== PYTHON ===')
console.log(py)
console.log('\n=== JAVASCRIPT ===')
console.log(js)
