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
    paramNames?: string[]

    constructor(
        props: { body: Block; name: string; paramNames?: string[] },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name
        this.body = props.body
        this.paramNames = props.paramNames
    }

    /**
     * 함수를 나타내는 `FunctionObject`를 생성하고 현재 스코프에 추가합니다.
     * @param scope - 함수가 선언되는 현재의 스코프입니다.
     */
    override execute(scope: Scope): Promise<void> {
        // 함수가 선언될 때의 스코프(scope)를 캡처하여 FunctionObject를 생성합니다.
        // 이것이 바로 클로저의 핵심 원리입니다.
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
        const paramNames =
            this.paramNames ?? extractParamsFromTokens(this.tokens)

        const params: Record<string, ValueType> = Object.fromEntries(
            paramNames.map((name) => [name, new ValueType()]),
        )

        const functionScope = new Scope({
            parent: scope,
            initialVariable: params,
            callerNode: this,
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
    public params: Record<string, Evaluable>

    constructor(
        props: { name: string; params: Record<string, Evaluable> },
        public override tokens: Token[],
    ) {
        super()

        this.name = props.name!
        this.params = props.params
    }

    /**
     * 스코프에서 함수를 찾아 실행하고, 그 결과값을 반환합니다.
     *
     * 1. `scope.getFunctionObject`를 통해 현재 또는 상위 스코프에서 호출할 함수 객체를 찾습니다.
     * 2. `functionObject.run`을 호출하여 함수를 실행합니다. 이 때 `FunctionObject`는 자신이 기억하고 있던
     *    선언 시점의 스코프를 부모로 하는 새로운 실행 스코프를 생성하여 함수 본문을 실행합니다.
     *
     * @param scope - 함수가 호출되는 현재의 스코프입니다.
     * @param args - 함수에 전달될 인자입니다. (선택 사항)
     * @returns 함수의 실행 결과값 (`ValueType`)을 반환합니다.
     */
    override async execute(
        scope: Scope,
        args?: FunctionInvokingParams,
    ): Promise<ValueType> {
        if (!args) {
            args = await evaluateParams(this.params, scope)
        }

        const functionObject = scope.getFunctionObject(this.name)

        try {
            const returnValue = await functionObject.run(args, scope)
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

            if (error instanceof YaksokError) {
                if (!error.tokens) {
                    error.tokens = this.tokens
                }

                if (!error.codeFile) {
                    error.codeFile = scope.codeFile
                }
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

function extractParamsFromTokens(allTokens: Token[]): string[] {
    const linebreakIndex = allTokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )

    const headers = allTokens.slice(0, linebreakIndex)
    const params: string[] = []

    for (let i = 0; i < headers.length - 1; i++) {
        if (headers[i].type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
            continue
        }

        const nextToken = headers[i + 1]
        if (nextToken?.type !== TOKEN_TYPE.IDENTIFIER) {
            continue
        }

        const nextNextToken = headers[i + 2]
        if (nextNextToken?.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            params.push(nextToken.value)
        } else if (nextNextToken?.type === TOKEN_TYPE.COMMA) {
            let j = i + 1
            while (j < headers.length && headers[j]?.type === TOKEN_TYPE.IDENTIFIER) {
                params.push(headers[j].value)
                const after = headers[j + 1]
                if (after?.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
                    break
                }
                if (after?.type === TOKEN_TYPE.COMMA) {
                    j += 2
                } else {
                    break
                }
            }
        }
    }

    return params
}
