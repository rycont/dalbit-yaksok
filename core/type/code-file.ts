import { YaksokError } from '../error/common.ts'
import { executer } from '../executer/index.ts'
import { Scope } from '../executer/scope.ts'
import { assertIndentValidity } from '../prepare/lex/indent-validity.ts'
import { mergeArgumentBranchingTokens } from '../prepare/lex/merge-argument-branching-tokens.ts'
import { parse } from '../prepare/parse/index.ts'
import { tokenize } from '../prepare/tokenize/index.ts'
import { getFunctionDeclareRanges } from '../util/get-function-declare-ranges.ts'

import type { Block } from '../node/block.ts'
import type { Rule } from '../prepare/parse/type.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { YaksokSession } from '../session/session.ts'
import { postprocessErrors } from '../error/postprocess.ts'
import { Node } from '../node/base.ts'

/**
 * `달빛 약속` 소스코드 파일 하나를 나타내는 클래스입니다.
 * 파일 단위의 처리 과정(토크나이징, 파싱, 실행)을 담당합니다.
 *
 * 이 클래스의 인스턴스는 `YaksokSession`에 의해 관리됩니다.
 */
export class CodeFile {
    private tokenized: Token[] | null = null
    private parsed: Block | null = null
    private functionDeclareRangesCache: ReturnType<
        typeof getFunctionDeclareRanges
    > | null = null
    private exportedRulesCache: Rule[] | null = null

    public validationScopes: Map<Node, Scope> = new Map()
    public ranScope: Scope | null = null
    public session: YaksokSession | null = null
    public executionDelay: number | null = null

    constructor(public text: string, public fileName: string | symbol) {}

    /**
     * `CodeFile`을 `YaksokSession`에 마운트합니다.
     * 이 과정을 통해 `CodeFile`은 상위 세션의 상태와 설정에 접근할 수 있게 됩니다.
     * @param session - 이 `CodeFile`을 소유하는 `YaksokSession` 인스턴스입니다.
     */
    mount(session: YaksokSession) {
        this.session = session
    }

    /**
     * 이 `CodeFile`이 세션에 마운트되었는지 여부를 반환합니다.
     */
    public get mounted(): boolean {
        return this.session !== null
    }

    /**
     * 소스코드를 토큰화한 결과를 반환합니다.
     *
     * **지연 평가 및 캐싱**: 이 getter에 처음 접근할 때만 토크나이징을 수행하고,
     * 그 결과를 내부 속성에 캐싱합니다.
     * 이후의 접근에서는 캐시된 값을 즉시 반환합니다.
     *
     * @returns `Token` 객체의 리스트를 반환합니다.
     */
    public get tokens(): Token[] {
        if (this.tokenized) {
            return this.tokenized
        }

        const tokens = tokenize(this.text)

        const functionDeclareRangesByType = getFunctionDeclareRanges(tokens)

        const functionDeclareRanges = [
            ...functionDeclareRangesByType.yaksok,
            ...functionDeclareRangesByType.ffi,
        ]

        const merged = mergeArgumentBranchingTokens(
            tokens,
            functionDeclareRanges,
        )

        assertIndentValidity(merged)
        this.tokenized = merged

        return merged
    }

    /**
     * 코드를 토큰화하고 인덴트 유효성 결과를 반환합니다. 유효하지 않은 토큰은 오류를 던지는 대신 errors 리스트에 반환합니다.
     */

    public getTokensOptimistically(): {
        tokens?: Token[]
        errors?: YaksokError[]
    } {
        try {
            const tokens = tokenize(this.text)

            const functionDeclareRangesByType = getFunctionDeclareRanges(tokens)

            const functionDeclareRanges = [
                ...functionDeclareRangesByType.yaksok,
                ...functionDeclareRangesByType.ffi,
            ]

            const merged = mergeArgumentBranchingTokens(
                tokens,
                functionDeclareRanges,
            )

            try {
                assertIndentValidity(merged)
                return {
                    tokens: merged,
                    errors: [],
                }
            } catch (error) {
                if (error instanceof YaksokError) {
                    return {
                        tokens: error.tokens,
                        errors: [error],
                    }
                }

                throw error
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                return {
                    tokens: error.tokens,
                    errors: [error],
                }
            }

            throw error
        }
    }

    /**
     * 토큰화된 코드를 파싱하여 생성된 추상 구문 트리(AST)를 반환합니다.
     *
     * **지연 평가 및 캐싱**: 이 getter에 처음 접근할 때만 파싱을 수행하고,
     * 그 결과를 내부 속성에 캐싱합니다.
     *
     * @returns AST의 루트 노드인 `Block` 객체를 반환합니다.
     */
    public get ast(): Block {
        if (!this.parsed) {
            this.parse()
        }

        return this.parsed as Block
    }

    /**
     * 일부 오류를 무시하고 AST를 최대한 생성하여 반환합니다.
     * 주로 언어 서버(LSP) 등에서 불완전한 코드를 분석해야 할 때 사용됩니다.
     * `parse(this, true)`를 호출하는 것과 동일한 효과를 가집니다.
     *
     * @returns 생성된 AST의 루트 노드인 `Block` 객체를 반환합니다.
     */
    public parseOptimistically(): Block {
        return parse(this, true).ast
    }

    /**
     * 코드 내의 함수 선언 범위를 반환합니다.
     */
    public get functionDeclareRanges(): ReturnType<
        typeof getFunctionDeclareRanges
    > {
        if (this.functionDeclareRangesCache === null) {
            this.functionDeclareRangesCache = getFunctionDeclareRanges(
                this.tokens,
            )
        }

        return this.functionDeclareRangesCache
    }

    /**
     * 이 파일에서 다른 파일로 내보내는 파싱 규칙을 반환합니다.
     */
    public get exportedRules(): Rule[] {
        try {
            if (!this.exportedRulesCache) {
                this.parse()
            }

            return this.exportedRulesCache as Rule[]
        } catch (e) {
            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = this
            }

            throw e
        }
    }

    /**
     * 내부적으로 `parse` 함수를 호출하여 AST를 생성하고 캐싱합니다.
     * 이 메서드는 `ast`나 `exportedRules` getter에서 필요할 때 호출됩니다.
     */
    private parse() {
        const parseResult = parse(this)
        this.parsed = parseResult.ast
        this.exportedRulesCache = parseResult.exportedRules
    }

    /**
     * 코드를 정적으로 분석하여 유효성을 검사하고 잠재적인 오류를 찾습니다.
     * @returns 검사 과정에서 발견된 오류(`YaksokError`) 리스트와, 검사에 사용된 스코프를 반환합니다.
     */
    public validate(): { errors: YaksokError[]; validatingScope: Scope } {
        if (this.validationScopes) {
            this.validationScopes.clear()
        }

        const validatingScope = new Scope({
            codeFile: this,
        })

        try {
            this.registerScope(validatingScope, this.ast)

            const errors = this.ast.validate(validatingScope)
            const mergedErrors = postprocessErrors(
                errors,
                this.tokens,
                validatingScope,
            )

            return {
                errors: mergedErrors,
                validatingScope,
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                return {
                    errors: [error],
                    validatingScope,
                }
            }

            throw error
        }
    }

    /**
     * 파싱된 AST를 실행합니다.
     *
     * **실행 결과 캐싱**: 이 메서드는 실행이 완료된 후 최종 스코프를 `ranScope`에 캐싱합니다.
     * 만약 이미 실행된 파일에 대해 `run`이 다시 호출되면, 실제 코드를 재실행하지 않고
     * 캐시된 스코프를 즉시 반환합니다. 이는 모듈이 여러 번 참조되어도 단 한 번만 실행되도록 보장합니다.
     *
     * @returns 실행이 완료된 후의 최종 스코프(`Scope`) 객체를 반환합니다.
     */
    public async run(): Promise<Scope> {
        if (this.ranScope) {
            return this.ranScope
        }

        const result = await executer(this.ast, this)
        this.ranScope = result

        return result
    }

    public registerScope(scope: Scope, node: Node) {
        this.validationScopes.set(node, scope)
    }
}

/**
 * `CodeFile`에 적용할 수 있는 추가 설정 옵션입니다.
 */
export interface CodeFileConfig {
    /**
     * 코드 실행 시 각 구문(statement) 사이에 추가할 딜레이(ms)입니다.
     * 디버깅이나 실행 과정 시각화에 유용하게 사용될 수 있습니다.
     */
    executionDelay?: number
}
