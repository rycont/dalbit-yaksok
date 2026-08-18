import { YaksokError } from '../error/common.ts'
import { ErrorInModuleError } from '../error/index.ts'
import { ValueType } from '../value/base.ts'
import { Evaluable, Identifier, Node } from './base.ts'
import { SubscribeEvent } from './event.ts'
import { evaluateParams, FunctionInvoke } from './function.ts'

import { IncompleteMentionError } from '../error/unknown-node.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class Mention extends Node {
    static override friendlyName = '불러올 파일 이름'

    constructor(
        public value: string,
        public override tokens: Token[],
    ) {
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
                return await this.child.execute(moduleFileScope, scope)
            }

            if (this.child instanceof SubscribeEvent) {
                this.child.callerScope = scope
                await this.child.execute(moduleFileScope)
                return undefined as unknown as ValueType
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

        let mentionedModuleScope: Scope | undefined
        let moduleErrors: YaksokError[] = []

        try {
            const validationResult = moduleCodeFile.validate()

            mentionedModuleScope = validationResult.validatingScope
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

        const childErrors = mentionedModuleScope
            ? this.child.validate(mentionedModuleScope, scope)
            : []
        return [...moduleErrors, ...childErrors]
    }
}
