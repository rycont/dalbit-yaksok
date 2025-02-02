import { Executable, type Evaluable } from './base.ts'
import type { Block } from './block.ts'

import { isTruthy } from '../executer/internal/isTruthy.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

interface Case {
    condition?: Evaluable
    body: Block
}

export class IfStatement extends Executable {
    static override friendlyName = '조건문(만약)'

    constructor(public cases: Case[], public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope) {
        for (const { condition, body } of this.cases) {
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
}

export class ElseStatement extends Executable {
    static override friendlyName = '조건문(아니면)'

    constructor(public body: Block, public override tokens: Token[]) {
        super()
    }
}

export class ElseIfStatement extends Executable {
    static override friendlyName = '조건문(아니면 만약)'

    constructor(public elseIfCase: Case, public override tokens: Token[]) {
        super()
    }
}
