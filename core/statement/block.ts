import {
    YaksokError,
    Scope,
    AbortedSessionSignal,
    type Statement,
    type Token,
    ScopeChain,
} from '@dalbit-yaksok/core'

export class Block implements Statement {
    static friendlyName = '코드 덩어리'

    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public statements: Statement[],
        public tokens: Token[],
    ) {}

    async execute(scopeChain: ScopeChain): Promise<void> {
        for (const child of this.statements) {
            await onRunChild({
                childTokens: child.tokens,
                scope: this.scope,
            })

            await child.execute(scopeChain)
        }
    }

    validate(): YaksokError[] {
        const childErrors = this.statements.flatMap((child) => child.validate())

        for (const error of this.parsingErrors) {
            error.scope = this.scope
        }

        return childErrors.concat(this.parsingErrors)
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export async function onRunChild({
    scope,
    childTokens,
}: {
    scope: Scope
    childTokens: Token[]
    skipReport?: boolean
}) {
    if (!scope.session) {
        return
    }

    if (scope.session.runtimeContext?.abort?.signal.aborted) {
        throw new AbortedSessionSignal(childTokens)
    }

    await scope.session.tick()

    const throttle = scope.session.runtimeContext?.throttle ?? 0

    if (
        0 < throttle &&
        scope.codeFile &&
        scope.session.runtimeContext?.entry.has(scope.codeFile)
    ) {
        await new Promise((ok) => setTimeout(ok, throttle))
    }
}
