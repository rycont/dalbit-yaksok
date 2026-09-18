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
import { NotDefinedIdentifierError } from '../error/index.ts'
import {
    inferTokenSplitpointsFromErrors,
    Splitpoint,
} from '../prepare/lex/infer-token-splitpoint.ts'

/**
 * `달빛 약속` 소스코드 파일 하나를 나타내는 클래스입니다.
 * 파일 단위의 처리 과정(토크나이징, 파싱, 실행)을 담당합니다.
 *
 * 이 클래스의 인스턴스는 `YaksokSession`에 의해 관리됩니다.
 */
export class CodeFile {
    public validationScopes: Map<Node, Scope> = new Map()
    public ranScope: Scope | null = null
    public session: YaksokSession | null = null
    public executionDelay: number | null = null
    public appliedRules: Rule[] | null = null

    public splitpoints: Splitpoint[] = []
    public text: string

    constructor(
        text: string,
        public fileName: string | symbol,
    ) {
        this.text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }

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

    public get tokens(): Token[] {
        const tokens = tokenize(this.text, this.splitpoints)

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

    public get ast(): Block {
        return this.parse()
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
     * 내부적으로 `parse` 함수를 호출하여 AST를 생성하고 캐싱합니다.
     * 이 메서드는 `ast`나 `exportedRules` getter에서 필요할 때 호출됩니다.
     */
    private parse() {
        const seenErrorFingerprint = new Set<string>()
        const seenSplitpointFingerprint = new Set<string>()

        let parseResult: ReturnType<typeof parse>

        while (true) {
            parseResult = parse(this)

            const validatingScope = new Scope({
                codeFile: this,
            })

            const missingIdentifierErrors = parseResult.ast
                .validate(validatingScope)
                .filter((e) => e instanceof NotDefinedIdentifierError)

            if (missingIdentifierErrors.length === 0) {
                break
            }

            const missingIdentifierFingerprint = missingIdentifierErrors
                .map((e) => e.resource.name)
                .join('|')

            if (seenErrorFingerprint.has(missingIdentifierFingerprint)) {
                break
            }

            seenErrorFingerprint.add(missingIdentifierFingerprint)

            const inferredSplitpoints = inferTokenSplitpointsFromErrors(
                this,
                missingIdentifierErrors,
                parseResult.computedRules,
            )

            const splitpointFingerprint = inferredSplitpoints.join('|')

            if (seenSplitpointFingerprint.has(splitpointFingerprint)) {
                break
            }

            seenSplitpointFingerprint.add(splitpointFingerprint)
            this.splitpoints = inferredSplitpoints
        }

        this.appliedRules = parseResult.computedRules

        return parseResult.ast
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
