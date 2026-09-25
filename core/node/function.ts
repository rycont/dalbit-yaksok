import {
    Block,
    EmptyValue,
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
    Evaluable,
    Executable,
    FunctionObject,
    MissingRequiredArgumentError,
    Node,
    NodeCapability,
    ParameterElement,
    Rule,
    Scope,
    Token,
    UnexpectedArgumentError,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { FunctionDeclareRange } from '../prepare/parse/dynamicRule/local/type.ts'

export class FunctionDeclareHeader<
    T extends FunctionDeclareRange['type'],
> extends Node {
    constructor(
        public name: string,
        public invokingRules: Rule[],
        public parameterScheme: ParameterElement[],
        public range: FunctionDeclareRange & {
            type: T
        },
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

export class InvokingArguments extends Executable<Map<string, Evaluable>> {
    private readonly optionalFiller: [string, ValueType][]

    constructor(
        public readonly entries: Map<string, Evaluable>,
        public readonly parameterScheme: ParameterElement[],
        public override readonly tokens: Token[],
        public readonly parsingErrors: YaksokError[],
    ) {
        super()

        this.subnode = new Map(entries.entries())

        const optionalKeys = new Set(
            parameterScheme.filter((p) => p.optional).map((p) => p.name),
        )
        const providedKeys = new Set(entries.keys())

        const missingOptionals = Array.from(
            optionalKeys.difference(providedKeys),
        )

        this.optionalFiller = missingOptionals.map((key) => [
            key,
            new EmptyValue(),
        ])
    }

    override async execute(scope: Scope): Promise<Map<string, ValueType>> {
        const args = new Map(
            this.optionalFiller.concat(
                await Promise.all(
                    this.subnode
                        .entries()
                        .map<Promise<[string, ValueType]>>(async ([k, v]) => [
                            k,
                            await v.execute(scope),
                        ])
                        .toArray(),
                ),
            ),
        )

        return args
    }

    override validate(invokingScope: Scope): YaksokError[] {
        const argumentErrors = this.subnode
            .values()
            .flatMap((e) => e.validate(invokingScope))

        const providedArguments = new Set(this.subnode.keys())

        const requiredArguments = new Set(
            this.parameterScheme.filter((p) => !p.optional).map((p) => p.name),
        )

        const missingKeys = new Set(requiredArguments).difference(
            providedArguments,
        )

        const missingKeysError = missingKeys.size
            ? [
                  new MissingRequiredArgumentError({
                      tokens: this.tokens,
                      resource: {
                          names: Array.from(missingKeys),
                      },
                      scope: invokingScope,
                  }),
              ]
            : []

        const knownKeys = new Set(this.parameterScheme.map((p) => p.name))
        const unknownKeys = Array.from(providedArguments.difference(knownKeys))

        const unknownKeysError = unknownKeys.length
            ? [
                  new UnexpectedArgumentError({
                      tokens: this.subnode.get(unknownKeys[0])!.tokens,
                      resource: {
                          names: unknownKeys,
                      },
                      scope: invokingScope,
                  }),
              ]
            : []

        for (const e of this.parsingErrors) {
            e.scope = invokingScope
        }

        return argumentErrors
            .toArray()
            .concat(missingKeysError)
            .concat(unknownKeysError)
            .concat(this.parsingErrors)
    }
}
