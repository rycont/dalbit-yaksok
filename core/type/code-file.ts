import {
    Block,
    executer,
    inferTokenSplitpointsFromErrors,
    NotDefinedIdentifierError,
    parseStatement,
    renderErrorString,
    RuntimeContext,
    Scope,
    Splitpoint,
    tokenize,
    YaksokError,
    YaksokSession,
    getLineTokens,
    type Token,
    RunFrame,
    createRunFrame,
} from '@dalbit-yaksok/core'

export class CodeFile {
    readonly ast: Block
    readonly tokens: Token[]
    readonly text: string
    readonly prepareErrors: YaksokError[]

    private _ranFrame: RunFrame | null = null

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

    public get ranFrame(): RunFrame | null {
        return this._ranFrame
    }

    public async run(
        runtimeContext?: Partial<RuntimeContext>,
    ): Promise<RunFrame> {
        if (this.prepareErrors.length !== 0) {
            throw new Error('오류가 존재하는 CodeFile은 실행할 수 없습니다.')
        }

        if (this._ranFrame) {
            throw new Error('CodeFile은 한번만 실행할 수 있습니다.')
        }

        const runFrame = createRunFrame(this.ast.scope, this.session.baseFrame)

        try {
            await this.session.withRuntimeContext(
                () => executer(this.ast, runFrame),
                runtimeContext?.entry
                    ? (runtimeContext as Partial<RuntimeContext> &
                          Pick<RuntimeContext, 'entry'>)
                    : {
                          ...runtimeContext,
                          entry: new Set([this]),
                      },
            )

            await Promise.allSettled(this.session.aliveListeners)

            this._ranFrame = runFrame

            return runFrame
        } catch (e) {
            if (e instanceof YaksokError) {
                if (!e.codeFile) {
                    e.codeFile = this
                }

                this.session.stderr(renderErrorString(e), e)

                return runFrame
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

    while (true) {
        tokens = tokenize(code, inferredSplitpoints)
        const tokenLines = getLineTokens(tokens)

        const scope = new Scope({
            session,
        })

        const parseResult = parseStatement(tokenLines, scope)

        ast = new Block(scope, parseResult, tokens)

        validationErrors = ast.validate()

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
        validationErrors: validationErrors,
        tokens,
    }
}
