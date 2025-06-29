import { YaksokError } from '../error/common.ts'
import { ErrorInModuleError } from '../error/index.ts'
import { ValueType } from '../value/base.ts'
import { Evaluable, Identifier, Node } from './base.ts'
import { evaluateParams, FunctionInvoke } from './function.ts'

import { IncompleteMentionError } from '../error/unknown-node.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

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
        const moduleCodeFile = scope.codeFile!.session!.getCodeFile(
            this.fileName,
        )

        try {
            const moduleFileScope = await moduleCodeFile.run()

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
        const moduleCodeFile = scope.codeFile!.session!.getCodeFile(
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
            }
        }

        return [...moduleErrors, ...childErrors]
    }
}
