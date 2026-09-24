import { YaksokError } from '../error/common.ts'
import { ErrorInModuleError } from '../error/index.ts'
import { ValueType } from '../value/base.ts'
import { Evaluable, Identifier, Node } from './base.ts'
import { SubscribeEvent } from './event.ts'
import { FunctionInvoke } from './function.ts'

import { IncompleteMentionError } from '../error/unknown-node.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { EmptyValue } from '@dalbit-yaksok/core'

export class Mention extends Node {
    static override friendlyName = '불러올 파일 이름'

    constructor(
        public override value: string,
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

        return [error]
    }
}

export class MentionScope extends Evaluable<FunctionInvoke | Identifier> {
    static override friendlyName = '불러오기'

    constructor(
        public fileName: string,
        private definedScope: Scope,
        subnode: FunctionInvoke | Identifier,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = subnode
    }

    override async execute(scope: Scope): Promise<ValueType> {
        try {
            if (this.subnode instanceof FunctionInvoke) {
                return await this.subnode.execute(this.definedScope, scope)
            }

            if (this.subnode instanceof SubscribeEvent) {
                await this.subnode.execute(scope)
                return new EmptyValue()
            }

            return await this.subnode.execute(this.definedScope)
        } catch (error) {
            if (error instanceof YaksokError) {
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
        return '@' + this.fileName + ' ' + this.subnode.toPrint()
    }

    override validate(scope: Scope): YaksokError[] {
        if (this.subnode instanceof FunctionInvoke) {
            return this.subnode.validate(this.definedScope, scope)
        } else {
            return this.subnode.validate(this.definedScope)
        }
    }
}
