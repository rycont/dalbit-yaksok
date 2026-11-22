import {
    Evaluable,
    Token,
    Scope,
    ValueType,
    assertValidReturnValue,
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
    YaksokError,
    EmptyValue,
    SlotKey,
    RunFrame,
    Runnable,
    isRunnable,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'

export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    constructor(
        public scope: Scope,
        private slot: SlotKey,
        public readonly invokingArguments: InvokingArguments,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scopeChain: RunFrame): Promise<ValueType> {
        const evaluatedArgument = await this.invokingArguments.execute(
            this.scope,
        )

        try {
            const runnable = scopeChain.get(this.slot)

            if (!isRunnable(runnable)) {
                throw '예?'
            }

            const returnValue =
                (await runnable[Runnable].run(evaluatedArgument)) ||
                new EmptyValue()

            assertValidReturnValue(
                returnValue,
                this.tokens,
                runnable[Runnable].name,
            )

            return returnValue
        } catch (error) {
            if (error instanceof ErrorInFFIExecution) {
                const errorInstance = new ErrorOccurredWhileRunningFFIExecution(
                    {
                        child: error,
                        tokens: this.tokens,
                        ffiName: this.scope.slots.get(this.slot).name,
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

    override validate(): YaksokError[] {
        return this.invokingArguments.validate(this.scope)
    }
}
