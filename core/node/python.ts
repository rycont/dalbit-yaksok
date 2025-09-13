import { YaksokError } from '../error/common.ts'
import { Evaluable, Executable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'

export class PythonImport extends Executable {
    static override friendlyName = '파이썬 불러오기'

    constructor(
        public module: string,
        public names: string[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const session = scope.codeFile?.session
        if (!session) return

        const namesPart = this.names.join(', ')
        await session.runFFI('Python', `from ${this.module} import ${namesPart}`, {})
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
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

        console.log('[PythonCall.execute] this.args', this.args)
        const evaluatedArgs = await Promise.all(this.args.map((a) => a.execute(scope)))
        const argsMap: Record<string, ValueType> = Object.fromEntries(
            evaluatedArgs.map((v, i) => [String(i), v]),
        )

        const result = await session.runFFI('Python', `CALL ${this.funcName}`, argsMap)
        return result
    }

    override validate(scope: Scope): YaksokError[] {
        return this.args
            .flatMap((a) => a.validate(scope))
            .filter((e): e is YaksokError => !!e)
    }
}


