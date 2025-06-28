import { Evaluable, Identifier, Node } from './base.ts'
import { ErrorInModuleError } from '../error/index.ts'
import { YaksokError } from '../error/common.ts'
import { FunctionInvoke } from './function.ts'
import { evaluateParams } from './function.ts'
import { ValueType } from '../value/base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'
import { IncompleteMentionError } from '../error/unknown-node.ts'

export class Mention extends Node {
    static override friendlyName = '불러올 파일 이름'

    constructor(public value: string, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return '@' + this.value
    }

    override validate(scope: Scope): YaksokError[] {
        const error = new IncompleteMentionError({
            tokens: this.tokens,
            resource: {
                node: this,
            },
        })

        error.codeFile = scope.codeFile

        return [error]
    }
}

export class MentionScope extends Evaluable {
    static override friendlyName = '불러오기'

    constructor(
        public fileName: string,
        public child: FunctionInvoke | Identifier,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const moduleCodeFile = scope.codeFile!.runtime!.getCodeFile(
            this.fileName,
        )

        try {
            await moduleCodeFile.run()

            const moduleFileScope = moduleCodeFile.runResult!.scope

            if (this.child instanceof FunctionInvoke) {
                const evaluatedParams = await evaluateParams(
                    this.child.params,
                    scope,
                )

                return await this.child.execute(
                    moduleFileScope,
                    evaluatedParams,
                )
            }

            return await this.child.execute(moduleFileScope)
        } catch (error) {
            if (error instanceof YaksokError) {
                error.codeFile = moduleCodeFile

                throw new ErrorInModuleError({
                    resource: {
                        fileName: this.fileName,
                    },
                    tokens: this.tokens,
                    child: error,
                })
            }

            throw error
        }
    }

    override toPrint(): string {
        return '@' + this.fileName + ' ' + this.child.toPrint()
    }

    override validate(scope: Scope): YaksokError[] {
        const moduleCodeFile = scope.codeFile!.runtime!.getCodeFile(
            this.fileName,
        )

        let validatingScope: Scope | undefined
        let moduleErrors: YaksokError[] = []

        try {
            const validationResult = moduleCodeFile.validate()

            validatingScope = validationResult.validatingScope
            moduleErrors = validationResult.errors
        } catch (error) {
            if (error instanceof YaksokError) {
                error.codeFile = moduleCodeFile

                const errorInstance = new ErrorInModuleError({
                    resource: {
                        fileName: this.fileName,
                    },
                    tokens: this.tokens,
                    child: error,
                })

                errorInstance.codeFile = scope.codeFile

                return [errorInstance]
            }

            throw error
        }

        let childErrors: YaksokError[] = []

        if (this.child instanceof FunctionInvoke) {
            for (const paramName in this.child.params) {
                const param = this.child.params[paramName]
                childErrors = childErrors.concat(param.validate(scope))
            }
        } else {
            // validatingScope가 undefined가 아닐 때만 자식 노드의 validate 호출
            if (validatingScope) {
                childErrors = childErrors.concat(
                    this.child.validate(validatingScope),
                )
            } else {
                // validatingScope가 없는 경우 (예: 모듈 유효성 검사 실패 또는 아직 실행 전)
                // 이 경우 자식 노드의 유효성을 현재 스코프에서 검사할지,
                // 아니면 오류로 처리할지 정책에 따라 결정 필요.
                // 여기서는 일단 validatingScope가 있을 때만 검사하도록 함.
                // 필요하다면 여기에 추가적인 오류 처리 로직을 넣을 수 있음.
                // 예: this.errors.push(new SomeErrorForMissingModuleScope(...))
            }
        }

        return [...moduleErrors, ...childErrors]
    }
}
