import { YaksokError } from '../error/common.ts'
import { Executable, Node, type Evaluable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class EOL extends Node {
    static override friendlyName = '줄바꿈'

    constructor(public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Indent extends Node {
    static override friendlyName = '들여쓰기'

    constructor(public size: number, public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Print extends Executable {
    static override friendlyName = '보여주기'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const printFunction = scope.codeFile?.session?.stdout || console.log
        const evaluated = await this.value.execute(scope)

        printFunction(evaluated.toPrint())
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}
