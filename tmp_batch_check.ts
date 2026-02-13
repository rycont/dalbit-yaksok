import { YaksokSession } from './core/mod.ts'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

type AnyNode = any

class Checker {
  unsupported = new Set<string>()
  checkProgram(block: AnyNode) {
    for (const c of block.children ?? []) this.stmt(c)
  }
  stmt(n: AnyNode) {
    switch (n?.constructor?.name) {
      case 'EOL': return
      case 'SetVariable': return void this.expr(n.value)
      case 'Print': return void this.expr(n.value)
      case 'IfStatement':
        for (const cs of n.cases ?? []) {
          if (cs.condition) this.expr(cs.condition)
          for (const c of cs.body?.children ?? []) this.stmt(c)
        }
        return
      case 'CountLoop':
        this.expr(n.count)
        for (const c of n.body?.children ?? []) this.stmt(c)
        return
      case 'Loop':
        for (const c of n.body?.children ?? []) this.stmt(c)
        return
      case 'ListLoop':
        this.expr(n.list)
        for (const c of n.body?.children ?? []) this.stmt(c)
        return
      case 'DeclareFunction':
        for (const c of n.body?.children ?? []) this.stmt(c)
        return
      case 'ReturnStatement':
        if (n.value) this.expr(n.value)
        return
      case 'Break': return
      case 'SetToIndex':
        this.expr(n.indexed)
        this.expr(n.index)
        this.expr(n.value)
        return
      default:
        this.unsupported.add(`stmt:${n?.constructor?.name}`)
    }
  }
  expr(n: AnyNode) {
    switch (n?.constructor?.name) {
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
      case 'Identifier':
        return
      case 'ValueWithParenthesis':
        return void this.expr(n.value)
      case 'Formula':
        for (const t of n.terms ?? []) this.exprOrOp(t)
        return
      case 'FunctionInvoke':
        for (const v of Object.values(n.params ?? {})) this.expr(v)
        return
      case 'ListLiteral':
        for (const v of n.values ?? []) this.expr(v)
        return
      case 'DictLiteral':
        for (const p of n.pairs ?? []) this.expr(p)
        return
      case 'IndexFetch':
        this.expr(n.indexed)
        this.expr(n.index)
        return
      case 'TypeOf':
        this.expr(n.value)
        return
      case 'KeyValuePair':
        this.expr(n.key)
        this.expr(n.value)
        return
      default:
        this.unsupported.add(`expr:${n?.constructor?.name}`)
    }
  }
  exprOrOp(n: AnyNode) {
    const ops = new Set(['AndOperator','OrOperator','PlusOperator','MinusOperator','MultiplyOperator','DivideOperator','IntegerDivideOperator','ModularOperator','PowerOperator','EqualOperator','NotEqualOperator','GreaterThanOperator','GreaterThanOrEqualOperator','LessThanOperator','LessThanOrEqualOperator','RangeOperator'])
    if (ops.has(n?.constructor?.name)) return
    this.expr(n)
  }
}

const dir = './test/codes'
const files = readdirSync(dir).filter(f => f.endsWith('.yak')).sort()
let ok = 0
const failed: string[] = []
const unsupportedGlobal = new Set<string>()
for (const file of files) {
  try {
    const code = readFileSync(join(dir, file), 'utf8')
    const s = new YaksokSession()
    const m = s.addModule('main', code)
    const checker = new Checker()
    checker.checkProgram(m.ast)
    if (checker.unsupported.size === 0) ok++
    else {
      failed.push(`${file} -> ${Array.from(checker.unsupported).join(', ')}`)
      for (const u of checker.unsupported) unsupportedGlobal.add(u)
    }
  } catch (e: any) {
    failed.push(`${file} -> ERROR:${e?.message || e}`)
  }
}

console.log(`OK ${ok}/${files.length}`)
if (failed.length) {
  console.log('---FAILED---')
  for (const f of failed) console.log(f)
}
if (unsupportedGlobal.size) {
  console.log('---UNSUPPORTED TYPES---')
  console.log(Array.from(unsupportedGlobal).sort().join('\n'))
}
