import { Scope } from '../executer/scope.ts'
import { assertValidReturnValue } from '../util/assert-valid-return-value.ts'
import { ValueType } from '../value/base.ts'
import { FunctionObject } from '../value/function.ts'
import { Evaluable, Executable, Identifier } from './base.ts'

import type {
    FunctionInvokingParams,
    ParameterElement,
} from '../constant/type.ts'
import { YaksokError } from '../error/common.ts'
import {
    ErrorInFFIExecution,
    ErrorOccurredWhileRunningFFIExecution,
} from '../error/ffi.ts'
import { type Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'
import { Block } from './block.ts'
import { EmptyValue } from '../value/primitive.ts'
import {
    MissingRequiredArgumentError,
    RequiredParametersShouldPriorError,
    UnexpectedArgumentError,
} from '../error/function.ts'

/**
 * `약속` 키워드를 통해 함수(약속)를 선언하는 AST 노드입니다.
 *
 * 이 노드는 실행될 때 실제로 함수 코드를 실행하는 것이 아니라,
 * 실행 가능한 `FunctionObject`를 생성하여 현재 스코프에 등록하는 역할을 합니다.
 * 이때 `FunctionObject`는 함수가 선언된 시점의 스코프를 기억하며, 이는 클로저(Closure)를 구현하는 핵심입니다.
 */
export class DeclareFunction extends Executable {
    static override friendlyName = '새 약속 만들기'

    name: string
    body: Block
    parameterElements: ParameterElement[]

    constructor(
        props: {
            body: Block
            name: string
            parameterElements: ParameterElement[]
        },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name
        this.body = props.body
        this.parameterElements = props.parameterElements
    }

    /**
     * 함수를 나타내는 `FunctionObject`를 생성하고 현재 스코프에 추가합니다.
     * @param scope - 함수가 선언되는 현재의 스코프입니다.
     */
    override execute(scope: Scope): Promise<void> {
        const paramNames = this.parameterElements.map((p) => p.name)

        const functionObject = new FunctionObject(
            this.name,
            this.body,
            scope,
            paramNames,
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

        const lastRequiredIndex = this.parameterElements.findLastIndex(
            (p) => p.required,
        )

        const lastOptionalIndex = this.parameterElements.findLastIndex(
            (p) => !p.required,
        )

        const bothTypeExitsts =
            lastOptionalIndex !== -1 && lastRequiredIndex !== -1

        if (bothTypeExitsts && lastOptionalIndex < lastRequiredIndex) {
            const misplacedParameterName =
                this.parameterElements[lastRequiredIndex].name

            const misplacedToken = this.tokens.find(
                (t) =>
                    t.type === TOKEN_TYPE.IDENTIFIER &&
                    t.value === misplacedParameterName,
            )

            declarationErrors.push(
                new RequiredParametersShouldPriorError({
                    tokens: misplacedToken ? [misplacedToken] : this.tokens,
                    resource: {
                        name: misplacedParameterName,
                    },
                }),
            )
        }

        const params: Record<string, ValueType> = Object.fromEntries(
            this.parameterElements.map(({ name }) => [name, new ValueType()]),
        )

        const functionScope = new Scope({
            parent: scope,
            initialVariable: params,
            callerNode: this,
        })

        try {
            scope.addFunctionObject(
                new FunctionObject(
                    this.name,
                    this.body,
                    functionScope,
                    this.parameterElements.map((p) => p.name),
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

        const bodyErrors = this.body.validate(functionScope)

        return [...declarationErrors, ...bodyErrors]
    }
}

/**
 * 선언된 함수(약속)를 호출하는 AST 노드입니다.
 *
 * @example
 * ```
 * 약속, 더하기 (A) (B)
 *     A + B 반환하기
 *
 * (더하기 1 2) 보여주기 // FunctionInvoke 노드가 생성되는 부분
 * ```
 */
export class FunctionInvoke extends Evaluable {
    static override friendlyName = '약속 사용하기'

    public name: string
    public argumentEvaluator: Record<string, Evaluable>
    public parameterScheme: ParameterElement[]

    private emptyArgumentPlaceholder: Record<string, EmptyValue>

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

        this.emptyArgumentPlaceholder = Object.fromEntries(
            props.parameterScheme
                .filter((p) => !p.required)
                .map((p) => [p.name, new EmptyValue()]),
        )
    }

    /**
     * 스코프에서 함수를 찾아 실행하고, 그 결과값을 반환합니다.
     *
     * 1. `scope.getFunctionObject`를 통해 현재 또는 상위 스코프에서 호출할 함수 객체를 찾습니다.
     * 2. `functionObject.run`을 호출하여 함수를 실행합니다. 이 때 `FunctionObject`는 자신이 기억하고 있던
     *    선언 시점의 스코프를 부모로 하는 새로운 실행 스코프를 생성하여 함수 본문을 실행합니다.
     *
     * @param definedScope - 함수가 호출되는 현재의 스코프입니다.
     * @param providedArgs - 함수에 전달될 인자입니다. (선택 사항)
     * @returns 함수의 실행 결과값 (`ValueType`)을 반환합니다.
     */
    override async execute(
        definedScope: Scope,
        argumentEvaluationScope: Scope = definedScope,
    ): Promise<ValueType> {
        const evaluatedArgument = await evaluateParams(
            this.argumentEvaluator,
            argumentEvaluationScope,
        )

        const invokingArgument: FunctionInvokingParams = {
            ...this.emptyArgumentPlaceholder,
            ...evaluatedArgument,
        }

        const functionObject = definedScope.getFunctionObject(this.name)

        try {
            const returnValue = await functionObject.run(
                invokingArgument,
                definedScope,
            )
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

                errorInstance.codeFile = definedScope.codeFile
                throw errorInstance
            }

            if (error instanceof YaksokError) {
                if (!error.tokens) {
                    error.tokens = this.tokens
                }

                if (!error.codeFile) {
                    error.codeFile = definedScope.codeFile
                }
            }

            throw error
        }
    }

    get value(): string {
        return this.name
    }

    override validate(
        definedScope: Scope,
        argumentEvaluationScope: Scope = definedScope,
    ): YaksokError[] {
        const errors: YaksokError[] = []

        const requiredParameters = new Set(
            this.parameterScheme.filter((p) => p.required).map((p) => p.name),
        )

        const providedArguments = new Set(Object.keys(this.argumentEvaluator))

        const missingArguments =
            requiredParameters.difference(providedArguments)

        if (missingArguments.size) {
            const error = new MissingRequiredArgumentError({
                resource: {
                    names: missingArguments.values().toArray(),
                },
                tokens: this.tokens,
            })

            errors.push(error)
        }

        const knownParameter = new Set(this.parameterScheme.map((p) => p.name))

        const unexpectedArguments = providedArguments.difference(knownParameter)

        if (unexpectedArguments.size) {
            const names = unexpectedArguments.values().toArray()

            const error = new UnexpectedArgumentError({
                resource: {
                    names,
                },
                tokens: this.argumentEvaluator[names[0]].tokens,
            })

            errors.push(error)
        }

        try {
            definedScope.getFunctionObject(this.name)
        } catch (error) {
            if (error instanceof YaksokError) {
                errors.push(error)
            } else {
                throw error
            }
        }

        const argsError = Object.values(this.argumentEvaluator)
            .map((param) => param.validate(argumentEvaluationScope))
            .flat()
            .filter((error): error is YaksokError => !!error)

        if (argsError.length > 0) {
            errors.push(...argsError)
        }

        return errors
    }
}

export class OptionalParameter extends Identifier {
    constructor(name: string, token: Token[]) {
        super(name, token)
    }
}

/**
 * 함수 호출에 사용될 인자들을 미리 평가(evaluate)하는 헬퍼 함수입니다.
 * @param params - 평가할 인자들의 맵 (`{ [key: string]: Evaluable }`)
 * @param scope - 평가가 이루어질 현재 스코프
 * @returns 평가된 인자들의 맵 (`{ [key: string]: ValueType }`)
 */
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
