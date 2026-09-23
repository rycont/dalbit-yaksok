import {
    Block,
    EmptyValue,
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
    Evaluable,
    Executable,
    FunctionInvokingParams,
    FunctionObject,
    Identifier,
    MissingRequiredArgumentError,
    Node,
    NodeCapability,
    ParameterElement,
    Rule,
    Scope,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { FunctionType } from '../prepare/parse/dynamicRule/local/type.ts'

export class FunctionDeclareHeader extends Node {
    constructor(
        public name: string,
        public invokingRules: Rule[],
        public parameterScheme: ParameterElement[],
        public override value: FunctionType,
        public override tokens: Token[],
    ) {
        super()
    }
}

export class DeclareFunction extends Executable<Block> {
    static override friendlyName = '새 약속 만들기'
    static override accepts = [NodeCapability.RETURN]

    constructor(
        body: Block,
        public name: string,
        private invokeRules: Rule[],
        private parameterScheme: ParameterElement[],
        public override tokens: Token[],
    ) {
        super()
        this.subnode = body
    }

    override execute(scope: Scope): Promise<void> {
        const functionObject = new FunctionObject(
            this.name,
            this.subnode,
            this.invokeRules,
            scope,
        )

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
        const declarationErrors = []

        const params: Record<string, ValueType> = Object.fromEntries(
            this.parameterScheme.map((p) => [
                p.name,
                p.optional ? new EmptyValue() : new ValueType(),
            ]),
        )

        const functionScope = new Scope({
            parent: scope,
            initialVariable: params,
        })

        try {
            scope.addFunctionObject(
                new FunctionObject(
                    this.name,
                    this.subnode,
                    this.invokeRules,
                    functionScope,
                ),
            )
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                declarationErrors.push(error)
            } else {
                throw error
            }
        }

        const bodyErrors = this.subnode.validate(functionScope)

        return [...declarationErrors, ...bodyErrors]
    }
}

export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    public readonly name: string
    private readonly argumentEvaluator: Record<string, Evaluable>
    private readonly parameterScheme: ParameterElement[]
    private readonly optionalFiller: Record<string, EmptyValue>

    constructor(
        props: {
            name: string
            argumentEvaluator: Record<string, Evaluable>
            parameterScheme: ParameterElement[]
        },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name
        this.argumentEvaluator = props.argumentEvaluator
        this.parameterScheme = props.parameterScheme

        const optionalKeys = new Set(
            props.parameterScheme.filter((p) => p.optional).map((p) => p.name),
        )
        const providedKeys = new Set(Object.keys(props.argumentEvaluator))

        const missingOptionals = Array.from(
            optionalKeys.difference(providedKeys),
        )

        this.optionalFiller = Object.fromEntries(
            missingOptionals.map((key) => [key, new EmptyValue()]),
        )
    }

    override async execute(
        definedScope: Scope,
        argumentEvaluationScope: Scope = definedScope,
    ): Promise<ValueType> {
        const evaluatedArgument = Object.assign(
            await evaluateParams(
                this.argumentEvaluator,
                argumentEvaluationScope,
            ),
            this.optionalFiller,
        )

        const functionObject = definedScope.getFunctionObject(this.name)

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

    override validate(
        definedScope: Scope,
        argumentEvaluationScope: Scope = definedScope,
    ): YaksokError[] {
        const argumentErrors = Object.values(this.argumentEvaluator).flatMap(
            (e) => e.validate(argumentEvaluationScope),
        )

        const providedArguments = new Set(Object.keys(this.argumentEvaluator))
        const requiredArguments = new Set(
            this.parameterScheme.filter((p) => !p.optional).map((p) => p.name),
        )

        const missingKeys = new Set(requiredArguments).difference(
            providedArguments,
        )

        if (missingKeys.size === 0) {
            return argumentErrors
        }

        const missingKeysError = new MissingRequiredArgumentError({
            tokens: this.tokens,
            resource: {
                names: Array.from(missingKeys),
            },
        })

        return argumentErrors.concat([missingKeysError])
    }
}

export class OptionalParameter extends Identifier {
    constructor(name: string, token: Token[]) {
        super(name, token)
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
