import {
    Evaluable,
    Token,
    Scope,
    ValueType,
    assertValidReturnValue,
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
    YaksokError,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'

export class FunctionInvoke extends Evaluable<InvokingArguments> {
    static override friendlyName = '약속 사용하기'

    constructor(
        public readonly name: string,
        public readonly invokingArguments: InvokingArguments,
        public override tokens: Token[],
    ) {
        super()

        this.subnode = invokingArguments
    }

    override async execute(
        invokingScope: Scope,
        declaredScope: Scope = invokingScope,
    ): Promise<ValueType> {
        const evaluatedArgument = await this.subnode.execute(invokingScope)
        const functionObject = declaredScope.getFunctionObject(this.name)

        try {
            const returnValue = await functionObject.run(evaluatedArgument)

            assertValidReturnValue(returnValue, this.tokens, this.name)

            return returnValue
        } catch (error) {
            if (error instanceof ErrorInFFIExecution) {
                const errorInstance = new ErrorOccurredWhileRunningFFIExecution(
                    {
                        child: error,
                        tokens: this.tokens,
                        ffiName: this.name,
                    },
                )

                throw errorInstance
            }

            if (error instanceof YaksokError) {
                if (!error.tokens) {
                    error.tokens = this.tokens
                }
            }

            throw error
        }
    }

    override validate(invokingScope: Scope): YaksokError[] {
        return this.invokingArguments.validate(invokingScope)
    }
}
