import { executer } from '../executer/index.ts'
import { Scope } from '../executer/scope.ts'
import { assertIndentValidity } from '../prepare/lex/indent-validity.ts'
import { mergeArgumentBranchingTokens } from '../prepare/lex/merge-argument-branching-tokens.ts'

import { getFunctionDeclareRanges } from '../util/get-function-declare-ranges.ts'

import type { Block } from '../node/block.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { NotDefinedIdentifierError, YaksokError } from '../error/index.ts'
import {
    inferTokenSplitpointsFromErrors,
    Splitpoint,
} from '../prepare/lex/infer-token-splitpoint.ts'
import { parse, tokenize, YaksokSession } from '@dalbit-yaksok/core'

export class CodeFile {
    readonly ast: Block
    readonly tokens: Token[]
    readonly text: string
    readonly prepareErrors: YaksokError[]

    private _ranScope: Scope | null = null

    constructor(
        text: string,
        public fileName: string | symbol,
        public session: YaksokSession,
    ) {
        const sanitized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        const { ast, tokens, validateResult } = parseWithSession(
            sanitized,
            session,
        )

        this.ast = ast
        this.tokens = tokens
        this.text = text
        this.prepareErrors = validateResult
    }

    public get ranScope(): Scope | null {
        return this._ranScope
    }

    public async run(): Promise<Scope> {
        if (this._ranScope) {
            throw new Error('CodeFile은 한번만 실행할 수 있습니다.')
        }

        const scope = await executer(
            this.ast,
            this.session.baseScope ?? undefined,
        )
        this._ranScope = scope

        return scope
    }
}

function tokenizeAndProcess(text: string, splitpoints: Splitpoint[]): Token[] {
    const tokens = tokenize(text, splitpoints)

    const functionDeclareRangesByType = getFunctionDeclareRanges(tokens)

    const functionDeclareRanges = [
        ...functionDeclareRangesByType.yaksok,
        ...functionDeclareRangesByType.ffi,
    ]

    const merged = mergeArgumentBranchingTokens(tokens, functionDeclareRanges)

    assertIndentValidity(merged)
    return merged
}

function parseWithSession(code: string, session: YaksokSession) {
    const seenErrorFingerprint = new Set<string>()
    const seenSplitpointFingerprint = new Set<string>()

    let validateResult: YaksokError[]
    let ast: ReturnType<typeof parse>
    let inferredSplitpoints: Splitpoint[] = []
    let tokens: Token[] | null = null

    while (true) {
        tokens = tokenizeAndProcess(code, inferredSplitpoints)
        ast = parse(tokens, session)

        const validatingScope = new Scope()

        validateResult = ast.validate(validatingScope)

        const missingIdentifierErrors = validateResult.filter(
            (e) => e instanceof NotDefinedIdentifierError,
        )

        if (missingIdentifierErrors.length === 0) {
            break
        }

        const missingIdentifierFingerprint = missingIdentifierErrors
            .map((e) => e.resource.name)
            .join('|')

        if (seenErrorFingerprint.has(missingIdentifierFingerprint)) {
            break
        }

        seenErrorFingerprint.add(missingIdentifierFingerprint)

        inferredSplitpoints = inferTokenSplitpointsFromErrors(
            code,
            missingIdentifierErrors,
        )

        const splitpointFingerprint = inferredSplitpoints.join('|')

        if (seenSplitpointFingerprint.has(splitpointFingerprint)) {
            break
        }

        seenSplitpointFingerprint.add(splitpointFingerprint)
    }

    return { ast, validateResult, tokens }
}
