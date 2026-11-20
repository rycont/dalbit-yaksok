import {
    Block,
    Evaluable,
    isTruthy,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export interface Case {
    condition: Evaluable | null
    body: Block
}

export class IfStatement implements Statement {
    public parsingErrors: YaksokError[] = []
    static friendlyName = '조건문(만약)'

    constructor(
        public cases: Case[],
        public tokens: Token[],
    ) {}

    async execute(scope: Scope) {
        for (const { condition, body } of this.cases) {
            const shouldStop = await this.shouldRun(condition, scope)
            if (!shouldStop) continue

            await body.execute(scope)
            break
        }
    }

    async shouldRun(
        condition: Evaluable | null,
        scope: Scope,
    ): Promise<boolean> {
        if (condition === null) {
            return true
        }

        const evaluated = await condition.execute(scope)
        return isTruthy(evaluated)
    }

    validate(scope: Scope): YaksokError[] {
        const errors = this.cases.flatMap((caseItem) => {
            const { condition, body } = caseItem

            const conditionErrors = condition?.validate(scope) || []
            const bodyErrors = body?.validate(scope) || []

            return conditionErrors.concat(bodyErrors)
        })

        return errors
    }
}
