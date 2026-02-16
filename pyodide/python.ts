import {
    Executable,
    Evaluable,
    FetchMember,
    Identifier,
    NotDefinedIdentifierError,
    YaksokError,
    Token,
    Scope,
    ValueType,
} from '@dalbit-yaksok/core'

export class PythonStatement extends Executable {
    static override friendlyName = '파이썬 구문 실행'

    constructor(
        public statement: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const session = scope.codeFile?.session
        if (!session) return

        await session.runFFI('Python', this.statement, {}, scope)
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
}

export class PythonImport extends PythonStatement {
    static override friendlyName = '파이썬 불러오기'
}

type PythonCallable = Identifier | FetchMember

export class PythonCall extends Evaluable {
    static override friendlyName = '파이썬 호출'

    constructor(
        public callable: PythonCallable,
        public args: Evaluable[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const session = scope.codeFile?.session
        if (!session) {
            throw new Error('Session not mounted')
        }

        const evaluatedArgs = await Promise.all(
            this.args.map((a) => this.executeArg(a, scope)),
        )
        if (this.callable instanceof Identifier) {
            const argsMap: Record<string, ValueType> = Object.fromEntries(
                evaluatedArgs.map((v, i) => [String(i), v]),
            )
            return await session.runFFI(
                'Python',
                `CALL ${this.callable.value}`,
                argsMap,
                scope,
            )
        }

        if (!isPythonIdentifierName(this.callable.memberName)) {
            throw new Error(`Invalid python method name: ${this.callable.memberName}`)
        }

        const evaluatedTarget = await this.executeArg(this.callable.target, scope)
        const argsMap: Record<string, ValueType> = {
            '0': evaluatedTarget,
            ...Object.fromEntries(
                evaluatedArgs.map((v, i) => [String(i + 1), v]),
            ),
        }

        return await session.runFFI(
            'Python',
            `CALL_METHOD ${this.callable.memberName}`,
            argsMap,
            scope,
        )
    }

    override validate(scope: Scope): YaksokError[] {
        return [
            ...this.validateArg(this.callable, scope),
            ...this.args.flatMap((a) => this.validateArg(a, scope)),
        ]
    }

    private async executeArg(arg: Evaluable, scope: Scope): Promise<ValueType> {
        try {
            return await arg.execute(scope)
        } catch (error) {
            const globalPath = this.resolvePythonGlobalPath(arg, error)
            if (!globalPath) {
                throw error
            }

            const session = scope.codeFile?.session
            if (!session) {
                throw error
            }

            return await session.runFFI(
                'Python',
                `GET_GLOBAL_PATH ${globalPath}`,
                {},
                scope,
            )
        }
    }

    private validateArg(arg: Evaluable, scope: Scope): YaksokError[] {
        const errors = arg.validate(scope).filter((e): e is YaksokError => !!e)

        if (!errors.length) {
            return []
        }

        if (
            isPythonGlobalPathEvaluable(arg) &&
            errors.every((error) => error instanceof NotDefinedIdentifierError)
        ) {
            return []
        }

        return errors
    }

    private resolvePythonGlobalPath(
        arg: Evaluable,
        error: unknown,
    ): string | null {
        if (!(error instanceof NotDefinedIdentifierError)) {
            return null
        }

        return getPythonGlobalPath(arg)
    }
}

function isPythonIdentifierName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}

function getPythonGlobalPath(arg: Evaluable): string | null {
    if (arg instanceof Identifier) {
        return isPythonIdentifierName(arg.value) ? arg.value : null
    }

    if (arg instanceof FetchMember) {
        const parentPath = getPythonGlobalPath(arg.target)
        if (!parentPath || !isPythonIdentifierName(arg.memberName)) {
            return null
        }

        return `${parentPath}.${arg.memberName}`
    }

    return null
}

function isPythonGlobalPathEvaluable(arg: Evaluable): boolean {
    return getPythonGlobalPath(arg) !== null
}
