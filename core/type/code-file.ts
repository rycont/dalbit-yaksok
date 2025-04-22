import { mergeArgumentBranchingTokens } from '../prepare/lex/merge-argument-branching-tokens.ts'
import { getFunctionDeclareRanges } from '../util/get-function-declare-ranges.ts'
import { assertIndentValidity } from '../prepare/lex/indent-validity.ts'
import { executer, type ExecuteResult } from '../executer/index.ts'
import { tokenize } from '../prepare/tokenize/index.ts'
import { parse } from '../prepare/parse/index.ts'
import { YaksokError } from '../error/common.ts'
import { Scope } from '../executer/scope.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Rule } from '../prepare/parse/type.ts'
import type { Runtime } from '../runtime/index.ts'
import type { Block } from '../node/block.ts'

export class CodeFile {
    private tokenized: Token[] | null = null
    private parsed: Block | null = null
    private functionDeclareRangesCache: ReturnType<
        typeof getFunctionDeclareRanges
    > | null = null
    private exportedRulesCache: Rule[] | null = null

    public runResult: ExecuteResult<Block> | null = null
    public runtime: Runtime | null = null

    constructor(public text: string, public fileName: string = '<이름 없음>') {}

    mount(runtime: Runtime) {
        this.runtime = runtime
    }

    public get mounted(): boolean {
        return this.runtime !== null
    }

    public get tokens(): Token[] {
        if (this.tokenized) {
            return this.tokenized
        }

        const tokens = tokenize(this.text)

        const functionDeclareRangesByType = getFunctionDeclareRanges(tokens)

        const functionDeclareRanges = [
            ...functionDeclareRangesByType.yaksok,
            ...functionDeclareRangesByType.ffi,
        ]

        const merged = mergeArgumentBranchingTokens(
            tokens,
            functionDeclareRanges,
        )

        assertIndentValidity(merged)
        this.tokenized = merged

        return merged
    }

    public get ast(): Block {
        if (!this.parsed) {
            this.parse()
        }

        return this.parsed as Block
    }

    public get functionDeclareRanges(): ReturnType<
        typeof getFunctionDeclareRanges
    > {
        if (this.functionDeclareRangesCache === null) {
            this.functionDeclareRangesCache = getFunctionDeclareRanges(
                this.tokens,
            )
        }

        return this.functionDeclareRangesCache
    }

    public get exportedRules(): Rule[] {
        try {
            if (!this.exportedRulesCache) {
                this.parse()
            }

            return this.exportedRulesCache as Rule[]
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = this
            }

            throw e
        }
    }

    private parse() {
        const parseResult = parse(this)
        this.parsed = parseResult.ast
        this.exportedRulesCache = parseResult.exportedRules
    }

    public validate(): { errors: YaksokError[]; validatingScope: Scope } {
        const validatingScope = new Scope({
            codeFile: this,
        })

        const errors = this.ast.validate(validatingScope)

        return {
            errors,
            validatingScope,
        }
    }

    public async run(): Promise<ExecuteResult<Block>> {
        if (this.runResult) {
            return this.runResult
        }

        const result = await executer(this.ast, this)
        this.runResult = result

        return result
    }
}
