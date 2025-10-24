import { AlreadyDefinedFunctionError } from '../error/function.ts'
import { NotDefinedIdentifierError } from '../error/index.ts'
import { ValueType } from '../value/base.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { RunnableObject } from '../value/function.ts'

/**
 * 실행 컨텍스트(Execution Context)를 관리하는 클래스입니다.
 * 변수와 함수의 저장, 검색, 수정을 담당하며, 스코프 체인을 통해 렉시컬 스코핑을 구현합니다.
 *
 * `Scope` 인스턴스는 계층적인 구조를 가집니다. 각 스코프는 부모 스코프(`parent`)를 가질 수 있으며,
 * 변수나 함수를 찾을 때 현재 스코프에 없으면 부모 스코프로 거슬러 올라가며 재귀적으로 탐색합니다.
 * 이는 `달빛 약속` 언어의 클로저와 변수 유효 범위를 결정하는 핵심적인 메커니즘입니다.
 */
export class Scope {
    variables: Record<string, ValueType>
    parent: Scope | undefined
    codeFile?: CodeFile
    private functions: Map<string, RunnableObject> = new Map()
    public callStackDepth: number

    constructor(
        config: {
            parent?: Scope
            codeFile?: CodeFile
            initialVariable?: Record<string, ValueType> | null
            callStackDepth?: number
        } = {},
    ) {
        this.variables = config.initialVariable || {}

        if (config.parent) {
            this.parent = config.parent
        }

        if (config.callStackDepth !== undefined) {
            this.callStackDepth = config.callStackDepth
        } else if (config.parent) {
            this.callStackDepth = config.parent.callStackDepth
        } else {
            this.callStackDepth = 0
        }

        if (config.codeFile) {
            this.codeFile = config.codeFile
        } else if (config.parent?.codeFile) {
            this.codeFile = config.parent.codeFile
        }

        if (!config.parent && config.codeFile?.session?.baseContext?.ranScope) {
            this.parent = config.codeFile.session.baseContext.ranScope
        }
    }

    /**
     * 변수를 설정합니다. 이미 상위 스코프에 변수가 존재하면 그 변수의 값을 갱신하고,
     * 그렇지 않으면 현재 스코프에 새로운 변수를 생성합니다.
     * @param name - 설정할 변수의 이름입니다.
     * @param value - 변수에 할당할 값입니다.
     */
    setVariable(name: string, value: ValueType) {
        if (this.parent?.askSetVariable(name, value)) return
        this.variables[name] = value
    }

    /**
     * 상위 스코프로 거슬러 올라가며 변수가 존재하는지 확인하고, 존재하면 값을 설정합니다.
     * `setVariable` 내부에서 호출되는 헬퍼 메서드입니다.
     * @param name - 설정할 변수의 이름입니다.
     * @param value - 변수에 할당할 값입니다.
     * @returns 변수를 성공적으로 설정했는지 여부를 반환합니다.
     */
    askSetVariable(name: string, value: ValueType): boolean {
        if (name in this.variables) {
            this.variables[name] = value
            return true
        }

        if (this.parent) return this.parent.askSetVariable(name, value)
        return false
    }

    /**
     * 현재 스코프 또는 상위 스코프에서 변수를 찾아 그 값을 반환합니다.
     *
     * **스코프 체인 탐색**: 먼저 현재 스코프의 `variables`에서 변수를 찾습니다.
     * 만약 없다면, `parent` 스코프의 `getVariable`을 재귀적으로 호출하여
     * 스코프 체인을 따라 올라가며 변수를 찾습니다. 최상위 스코프에도 변수가 없으면
     * `NotDefinedIdentifierError`를 발생시킵니다.
     *
     * @param name - 찾을 변수의 이름입니다.
     * @returns 변수의 값을 담은 `ValueType` 객체를 반환합니다.
     */
    getVariable(name: string): ValueType {
        if (name in this.variables) {
            return this.variables[name]
        }

        if (this.parent) {
            return this.parent.getVariable(name)
        }

        const errorInstance = new NotDefinedIdentifierError({
            resource: {
                name,
            },
        })

        errorInstance.codeFile = this.codeFile
        throw errorInstance
    }

    /**
     * 현재 스코프에 새로운 함수(약속)를 추가합니다.
     * @param functionObject - 추가할 함수를 나타내는 `RunnableObject`입니다.
     */
    addFunctionObject(functionObject: RunnableObject) {
        if (this.functions.has(functionObject.name)) {
            const errorInstance = new AlreadyDefinedFunctionError({
                resource: {
                    name: functionObject.name,
                },
            })
            errorInstance.codeFile = this.codeFile
            throw errorInstance
        }
        this.functions.set(functionObject.name, functionObject)
    }

    /**
     * 현재 스코프 또는 상위 스코프에서 함수(약속)를 찾아 반환합니다.
     *
     * 변수 검색과 마찬가지로, 스코프 체인을 따라 올라가며 재귀적으로 함수를 찾습니다.
     *
     * @param name - 찾을 함수의 이름입니다.
     * @returns 함수를 나타내는 `RunnableObject`를 반환합니다.
     */
    getFunctionObject(name: string): RunnableObject {
        const fromCurrentScope = this.functions.get(name)
        if (fromCurrentScope) return fromCurrentScope

        if (this.parent) {
            return this.parent.getFunctionObject(name)
        }

        const errorInstance = new NotDefinedIdentifierError({
            resource: {
                name,
            },
        })

        errorInstance.codeFile = this.codeFile
        throw errorInstance
    }
}
