import * as v from 'valibot'

import {
    Block,
    Identifier,
    NotDefinedIdentifierError,
    parse,
    renderErrorString,
    Rule,
    Scope,
    Token,
    tokenize,
    u,
    YaksokError,
    YaksokSession,
} from '@dalbit-yaksok/core'

import { executer } from '../executer/index.ts'
import {
    Splitpoint,
    inferTokenSplitpointsFromErrors,
} from '../prepare/lex/infer-token-splitpoint.ts'
import { createMentioningRule } from '../prepare/parse/dynamicRule/mention/create-mentioning-rules.ts'
import { postprocessErrors } from '../error/postprocess/index.ts'

export class CodeFile {
    readonly ast: Block
    readonly tokens: Token[]
    readonly text: string
    readonly prepareErrors: YaksokError[]

    private _mentionRules: Rule[] | null = null
    private _ranScope: Scope | null = null

    constructor(
        text: string,
        public fileName: string,
        public session: YaksokSession,
    ) {
        const sanitized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        const { ast, tokens, validationErrors } = parseWithSession(
            sanitized,
            session,
        )

        for (const e of validationErrors) {
            if (!e.codeFile) {
                e.codeFile = this
            }
        }

        this.ast = ast
        this.tokens = tokens
        this.text = text
        this.prepareErrors = validationErrors

        for (const error of validationErrors) {
            session.stderr(renderErrorString(error), error)
        }
    }

    public get ranScope(): Scope | null {
        return this._ranScope
    }

    public get mentionRules(): Rule[] | null {
        return this._mentionRules
    }

    public async run(): Promise<Scope> {
        if (this.prepareErrors.length !== 0) {
            throw new Error('오류가 존재하는 CodeFile은 실행할 수 없습니다.')
        }

        if (this._ranScope) {
            throw new Error('CodeFile은 한번만 실행할 수 있습니다.')
        }

        const rootScope = new Scope({
            session: this.session,
        })

        try {
            await executer(this.ast, rootScope)
            await Promise.allSettled(this.session.aliveListeners)

            this._ranScope = rootScope

            const exportedFunctionRules = rootScope.functions
                .values()
                .flatMap((v) =>
                    v.invokeRules.map((rule) =>
                        createMentioningRule(this.fileName, rule, rootScope),
                    ),
                )
                .toArray()

            const exportedEventRules = rootScope.events
                .values()
                .flatMap((n) =>
                    n.invokeRules.map((r) =>
                        createMentioningRule(this.fileName, r, rootScope),
                    ),
                )
                .toArray()

            const exportedVariableRules = createMentioningRule(
                this.fileName,
                {
                    pattern: [
                        u(
                            Identifier,
                            v.object({
                                value: v.picklist(
                                    Object.keys(rootScope.variables),
                                ),
                            }),
                        ),
                    ],
                    factory([node]) {
                        return node
                    },
                },
                rootScope,
            )

            this._mentionRules = exportedFunctionRules
                .concat(exportedVariableRules)
                .concat(exportedEventRules)

            return rootScope
        } catch (e) {
            if (e instanceof YaksokError) {
                if (!e.codeFile) {
                    e.codeFile = this
                }

                this.session.stderr(renderErrorString(e), e)

                return rootScope
            }

            throw e
        }
    }
}

function parseWithSession(code: string, session: YaksokSession) {
    const seenErrorFingerprint = new Set<string>()
    const seenSplitpointFingerprint = new Set<string>()

    let validationErrors: YaksokError[]
    let ast: ReturnType<typeof parse>
    let inferredSplitpoints: Splitpoint[] = []
    let tokens: Token[] | null = null
    let validatingScope: Scope

    while (true) {
        tokens = tokenize(code, inferredSplitpoints)
        ast = parse(tokens, session)

        validatingScope = new Scope(
            session.baseScope
                ? {
                      parent: session.baseScope,
                  }
                : {
                      session,
                  },
        )

        validationErrors = ast.validate(validatingScope)

        const missingIdentifierErrors = validationErrors.filter(
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

        inferredSplitpoints = inferredSplitpoints.concat(
            inferTokenSplitpointsFromErrors(code, missingIdentifierErrors),
        )

        const splitpointFingerprint = inferredSplitpoints.join('|')

        if (seenSplitpointFingerprint.has(splitpointFingerprint)) {
            break
        }

        seenSplitpointFingerprint.add(splitpointFingerprint)
    }

    return {
        ast,
        validationErrors: postprocessErrors(validationErrors, tokens),
        tokens,
    }
}
