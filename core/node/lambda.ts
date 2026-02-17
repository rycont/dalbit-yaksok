import { YaksokError } from '../error/common.ts'
import { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'
import { LambdaFunctionValue } from '../value/lambda-function.ts'
import { Evaluable } from './base.ts'

export class LambdaLiteral extends Evaluable<LambdaFunctionValue> {
    static override friendlyName = '람다'

    constructor(
        public paramNames: string[],
        public body: Evaluable,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<LambdaFunctionValue> {
        return new LambdaFunctionValue(this.paramNames, this.body, scope)
    }

    override validate(scope: Scope): YaksokError[] {
        const lambdaScope = new Scope({
            parent: scope,
            initialVariable: Object.fromEntries(
                this.paramNames.map((name) => [name, new ValueType()]),
            ),
            callerNode: this,
        })

        return this.body.validate(lambdaScope)
    }
}
