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
    ScopeChain,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'
import { FunctionSlot } from '../slot'

export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    constructor(
        public scope: Scope,
        private slot: FunctionSlot,
        public readonly invokingArguments: InvokingArguments,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scopeChain: ScopeChain): Promise<ValueType> {
        const evaluatedArgument = await this.invokingArguments.execute(
            this.scope,
        )

        try {
            const returnValue =
                (await this.slot.runnable.run(evaluatedArgument, scopeChain)) ||
                new EmptyValue()

            assertValidReturnValue(
                returnValue,
                this.tokens,
                this.slot.runnable.name,
            )

            return returnValue
        } catch (error) {
            if (error instanceof ErrorInFFIExecution) {
                const errorInstance = new ErrorOccurredWhileRunningFFIExecution(
                    {
                        child: error,
                        tokens: this.tokens,
                        ffiName: this.slot.name,
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
