import {
    YaksokError,
    Scope,
    AbortedSessionSignal,
    type Statement,
    type Token,
} from '@dalbit-yaksok/core'

export class Block implements Statement {
    static friendlyName = '코드 덩어리'

    public parsingErrors: YaksokError[] = []

    constructor(
        public statements: Statement[],
        public tokens: Token[],
    ) {}

    async execute(scope: Scope): Promise<void> {
        for (const child of this.statements) {
            await onRunChild({
                childTokens: child.tokens,
                scope,
            })

            await child.execute(scope)
        }
    }

    validate(scope: Scope): YaksokError[] {
        const childErrors = this.statements.flatMap((child) =>
            child.validate(scope),
        )

        for (const error of this.parsingErrors) {
            error.scope = scope
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
