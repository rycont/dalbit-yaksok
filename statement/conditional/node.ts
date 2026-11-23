import {
    Block,
    Evaluable,
    isTruthy,
    RunFrame,
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
        public scope: Scope,
        public cases: Case[],
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame) {
        for (const { condition, body } of this.cases) {
            const shouldStop = await this.shouldRun(condition, runFrame)
            if (!shouldStop) continue

            await body.execute(runFrame)
            break
        }
    }

    async shouldRun(
        condition: Evaluable | null,
        runFrame: RunFrame,
    ): Promise<boolean> {
        if (condition === null) {
            return true
        }

        const evaluated = await condition.execute(runFrame)
        return isTruthy(evaluated)
    }

    validate(): YaksokError[] {
        const errors = this.cases.flatMap((caseItem) => {
            const { condition, body } = caseItem

            const conditionErrors = condition?.validate() || []
            const bodyErrors = body?.validate() || []

            return conditionErrors.concat(bodyErrors)
        })

        return errors
    }
}
