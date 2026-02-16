import {
    Executable,
    Evaluable,
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

export class PythonCall extends Evaluable {
    static override friendlyName = '파이썬 호출'

    constructor(
        public funcName: string,
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

        console.debug('[PythonCall.execute] this.args', this.args)
        const evaluatedArgs = await Promise.all(
            this.args.map((a) => this.executeArg(a, scope)),
        )
        const argsMap: Record<string, ValueType> = Object.fromEntries(
            evaluatedArgs.map((v, i) => [String(i), v]),
        )

        const result = await session.runFFI(
            'Python',
            `CALL ${this.funcName}`,
            argsMap,
            scope,
        )
        return result
    }

    override validate(scope: Scope): YaksokError[] {
        return this.args.flatMap((a) => this.validateArg(a, scope))
    }

    private async executeArg(arg: Evaluable, scope: Scope): Promise<ValueType> {
        try {
            return await arg.execute(scope)
        } catch (error) {
            if (!this.canFallbackToPythonGlobal(arg, error)) {
                throw error
            }

            const session = scope.codeFile?.session
            if (!session) {
                throw error
            }

            return await session.runFFI(
                'Python',
                `GET_GLOBAL ${arg.value}`,
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
            arg instanceof Identifier &&
            isPythonIdentifierName(arg.value) &&
            errors.every((error) => error instanceof NotDefinedIdentifierError)
        ) {
            return []
        }

        return errors
    }

    private canFallbackToPythonGlobal(
        arg: Evaluable,
        error: unknown,
    ): arg is Identifier {
        return (
            arg instanceof Identifier &&
            isPythonIdentifierName(arg.value) &&
            error instanceof NotDefinedIdentifierError
        )
    }
}

export class PythonMethodCall extends Evaluable {
    static override friendlyName = '파이썬 메소드 호출'

    constructor(
        public target: Evaluable,
        public methodName: string,
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

        const evaluatedTarget = await this.executeArg(this.target, scope)
        const evaluatedArgs = await Promise.all(
            this.args.map((a) => this.executeArg(a, scope)),
        )
        const argsMap: Record<string, ValueType> = {
            '0': evaluatedTarget,
            ...Object.fromEntries(
                evaluatedArgs.map((v, i) => [String(i + 1), v]),
            ),
        }

        const result = await session.runFFI(
            'Python',
            `CALL_METHOD ${this.methodName}`,
            argsMap,
            scope,
        )
        return result
    }

    override validate(scope: Scope): YaksokError[] {
        return [
            ...this.validateArg(this.target, scope),
            ...this.args.flatMap((a) => this.validateArg(a, scope)),
        ]
    }

    private async executeArg(arg: Evaluable, scope: Scope): Promise<ValueType> {
        try {
            return await arg.execute(scope)
        } catch (error) {
            if (!this.canFallbackToPythonGlobal(arg, error)) {
                throw error
            }

            const session = scope.codeFile?.session
            if (!session) {
                throw error
            }

            return await session.runFFI(
                'Python',
                `GET_GLOBAL ${arg.value}`,
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
            arg instanceof Identifier &&
            isPythonIdentifierName(arg.value) &&
            errors.every((error) => error instanceof NotDefinedIdentifierError)
        ) {
            return []
        }

        return errors
    }

    private canFallbackToPythonGlobal(
        arg: Evaluable,
        error: unknown,
    ): arg is Identifier {
        return (
            arg instanceof Identifier &&
            isPythonIdentifierName(arg.value) &&
            error instanceof NotDefinedIdentifierError
        )
    }
}

function isPythonIdentifierName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}
