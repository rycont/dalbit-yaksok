import {
    Evaluable,
    Token,
    Scope,
    ValueType,
    assertValidReturnValue,
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
    YaksokError,
    NotDefinedIdentifierError,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'
import { FunctionDeclareHeader } from './header'

export class FunctionInvoke extends Evaluable<InvokingArguments> {
    static override friendlyName = '약속 사용하기'

    constructor(
        private readonly declareHeader: FunctionDeclareHeader,
        public readonly invokingArguments: InvokingArguments,
        public override tokens: Token[],
    ) {
        super()

        this.subnode = invokingArguments
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const evaluatedArgument = await this.subnode.execute(scope)
        const functionObject = this.declareHeader.runnable

        if (!functionObject) {
            throw new NotDefinedIdentifierError({
                resource: {
                    name: this.declareHeader.signature.functionName,
                },
            })
        }

        try {
            const returnValue = await functionObject.run(evaluatedArgument)

            assertValidReturnValue(
                returnValue,
                this.tokens,
                this.declareHeader.signature.functionName,
            )

            return returnValue
        } catch (error) {
            if (error instanceof ErrorInFFIExecution) {
                const errorInstance = new ErrorOccurredWhileRunningFFIExecution(
                    {
                        child: error,
                        tokens: this.tokens,
                        ffiName: this.declareHeader.signature.functionName,
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
