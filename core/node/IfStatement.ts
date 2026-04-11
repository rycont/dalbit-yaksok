import { type Evaluable, Executable } from './base.ts'
import type { Block } from './block.ts'
import { YaksokError } from '../error/common.ts'

import { isTruthy } from '../executer/internal/isTruthy.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

class StandaloneElseError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `"아니면"은 "만약" 조건문의 본문이 있어야 사용할 수 있어요.`
    }
}

class StandaloneElseIfError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)
        this.message = `"아니면 만약"은 "만약" 조건문의 본문이 있어야 사용할 수 있어요.`
    }
}

interface Case {
    condition?: Evaluable
    body: Block
}

export class IfStatement extends Executable {
    static override friendlyName = '조건문(만약)'

    constructor(
        public cases: Case[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope) {
        for (const { condition, body } of this.cases) {
            if (scope.codeFile?.session?.canRunNode) {
                if (!(await scope.codeFile?.session?.canRunNode(scope, this))) {
                    return
                }
            }

            const shouldStop = await this.shouldStop(condition, scope)
            if (!shouldStop) continue

            await body.execute(scope)
            break
        }
    }

    async shouldStop(
        condition: Evaluable | undefined,
        scope: Scope,
    ): Promise<boolean> {
        return !condition || isTruthy(await condition.execute(scope))
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.cases.flatMap((caseItem) => {
            const { condition, body } = caseItem

            const conditionErrors = condition?.validate(scope) || []
            const bodyErrors = body?.validate(scope) || []

            return conditionErrors.concat(bodyErrors)
        })

        return errors
    }
}

export class ElseStatement extends Executable {
    static override friendlyName = '조건문(아니면)'

    constructor(
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override validate(scope: Scope): YaksokError[] {
        return [
            new StandaloneElseError({ tokens: this.tokens }),
            ...this.body.validate(scope),
        ]
    }
}

export class ElseIfStatement extends Executable {
    static override friendlyName = '조건문(아니면 만약)'

    constructor(
        public elseIfCase: Case,
        public override tokens: Token[],
    ) {
        super()
    }

    override validate(scope: Scope): YaksokError[] {
        return [
            new StandaloneElseIfError({ tokens: this.tokens }),
            ...(this.elseIfCase.condition?.validate(scope) || []),
            ...this.elseIfCase.body.validate(scope),
        ]
    }
}
