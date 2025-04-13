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

    override validate(scope: Scope) {
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

    override validate(scope: Scope) {
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

        const childErrors = this.child.validate(validatingScope)

        return [...moduleErrors, ...(childErrors || [])]
    }
}
