import {
    Block,
    concatRuleList,
    createMentioningRule,
    executer,
    Identifier,
    inferTokenSplitpointsFromErrors,
    Node,
    NotDefinedIdentifierError,
    parseStatement,
    postprocessErrors,
    r,
    renderErrorString,
    RuleList,
    RuntimeContext,
    Scope,
    Splitpoint,
    tokenize,
    YaksokError,
    YaksokSession,
    type Token,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { getRulesFromMentioningFile } from '../prepare/parse/mention'

export class CodeFile {
    readonly ast: Block
    readonly tokens: Token[]
    readonly text: string
    readonly prepareErrors: YaksokError[]

    private _mentionRules: RuleList | null = null
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

    public get mentionRules(): RuleList | null {
        return this._mentionRules
    }

    public async run(runtimeContext?: Partial<RuntimeContext>): Promise<Scope> {
        // console.log(this.ast)
        if (this.prepareErrors.length !== 0) {
            throw new Error('오류가 존재하는 CodeFile은 실행할 수 없습니다.')
        }

        if (this._ranScope) {
            throw new Error('CodeFile은 한번만 실행할 수 있습니다.')
        }

        const rootScope = new Scope({
            session: this.session,
            codeFile: this,
        })

        try {
            await this.session.withRuntimeContext(
                () => executer(this.ast, rootScope),
                runtimeContext?.entry
                    ? (runtimeContext as Partial<RuntimeContext> &
                          Pick<RuntimeContext, 'entry'>)
                    : {
                          ...runtimeContext,
                          entry: new Set([this]),
                      },
            )

            await Promise.allSettled(this.session.aliveListeners)

            rootScope.finalize()

            this._ranScope = rootScope

            const exportedFunctionRules = concatRuleList(
                rootScope.functions
                    .values()
                    .map((v) =>
                        createMentioningRule(
                            this.fileName,
                            v.invokeRules,
                            rootScope,
                        ),
                    )
                    .toArray(),
            )

            const exportedEventRules = concatRuleList(
                rootScope.events
                    .values()
                    .map((n) =>
                        createMentioningRule(
                            this.fileName,
                            n.header.runnable!.invokeRules,
                            rootScope,
                        ),
                    )
                    .toArray(),
            )

            const exportedVariableRules = createMentioningRule(
                this.fileName,
                {
                    sr: [
                        r<Node[]>({
                            pattern: [
                                j.instance(Identifier).field({
                                    value: j.enum(
                                        Object.keys(rootScope.variables),
                                    ),
                                }),
                            ],
                            factory([node]) {
                                return node
                            },
                        }),
                    ],
                    rd: [],
                },
                rootScope,
            )

            this._mentionRules = concatRuleList([
                exportedFunctionRules,
                exportedVariableRules,
                exportedEventRules,
            ])

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
    let ast: Block
    let inferredSplitpoints: Splitpoint[] = []
    let tokens: Token[] | null = null
    let validatingScope: Scope

    while (true) {
        tokens = tokenize(code, inferredSplitpoints)
        const mentionRules = getRulesFromMentioningFile(tokens, session)

        const parseResult = parseStatement(tokens, session, mentionRules)

        ast = new Block(parseResult.statements, tokens)

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
