import { Scope } from '../executer/scope.ts'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { ValueType } from '../value/base.ts'
import { FunctionObject } from '../value/function.ts'
import { Evaluable, Executable } from './base.ts'

import type { FunctionInvokingParams } from '../constant/type.ts'
import { YaksokError } from '../error/common.ts'
import {
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
} from '../error/ffi.ts'
import { TOKEN_TYPE, type Token } from '../prepare/tokenize/token.ts'
import { Block } from './block.ts'

export class DeclareFunction extends Executable {
    static override friendlyName = '새 약속 만들기'

    name: string
    body: Block

    constructor(
        props: { body: Block; name: string },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name
        this.body = props.body
    }

    override execute(scope: Scope): Promise<void> {
        const functionObject = new FunctionObject(this.name, this.body, scope)

        try {
            scope.addFunctionObject(functionObject)
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const paramNames = extractParamsFromTokens(this.tokens)

        const params: Record<string, ValueType> = Object.fromEntries(
            paramNames.map((name) => [name, new ValueType()]),
        )

        const functionScope = new Scope({
            parent: scope,
            initialVariable: params,
        })

        const declarationErrors = []

        try {
            scope.addFunctionObject(
                new FunctionObject(this.name, this.body, functionScope),
            )
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                declarationErrors.push(error)
            } else {
                throw error
            }
        }

        const bodyErrors = this.body.validate(functionScope)

        return [...declarationErrors, ...bodyErrors]
    }
}

export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    public name: string
    public params: Record<string, Evaluable>

    constructor(
        props: { name: string; params: Record<string, Evaluable> },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name!
        this.params = props.params
    }

    override async execute(
        scope: Scope,
        args?: FunctionInvokingParams,
    ): Promise<ValueType> {
        if (!args) {
            args = await evaluateParams(this.params, scope)
        }

        const functionObject = scope.getFunctionObject(this.name)

        try {
            const returnValue = await functionObject.run(args)
            assertValidReturnValue(this, returnValue)

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

                errorInstance.codeFile = scope.codeFile
                throw errorInstance
            }

            throw error
        }
    }

    get value(): string {
        return this.name
    }

    override validate(scope: Scope): YaksokError[] {
        const errors: YaksokError[] = []

        try {
            scope.getFunctionObject(this.name)
        } catch (error) {
            if (error instanceof YaksokError) {
                errors.push(error)
            } else {
                throw error
            }
        }

        const argsError = Object.values(this.params)
            .map((param) => param.validate(scope))
            .flat()
            .filter((error): error is YaksokError => !!error)

        if (argsError.length > 0) {
            errors.push(...argsError)
        }

        return errors
    }
}

export async function evaluateParams(
    params: {
        [key: string]: Evaluable
    },
    scope: Scope,
): Promise<{ [key: string]: ValueType }> {
    const args: FunctionInvokingParams = {}

    for (const key in params) {
        const value = params[key]
        args[key] = await value.execute(scope)
    }

    return args
}

function extractParamsFromTokens(allTokens: Token[]): string[] {
    const linebreakIndex = allTokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )

    const headers = allTokens.slice(0, linebreakIndex)

    const params: string[] = []

    for (let i = 0; i < headers.length - 1; i++) {
        if (headers[i].type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            params.push(headers[i + 1].value)
        }
    }

    return params
}
