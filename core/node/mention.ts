import { Evaluable, Executable, Identifier } from './base.ts'
import { ErrorInModuleError } from '../error/index.ts'
import { YaksokError } from '../error/common.ts'
import { FunctionInvoke } from './function.ts'
import { evaluateParams } from './function.ts'
import { ValueType } from '../value/base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { CallFrame } from '../executer/callFrame.ts'
import type { Scope } from '../executer/scope.ts'

export class Mention extends Executable {
    static override friendlyName = '불러올 파일 이름'

    constructor(public value: string, public override tokens: Token[]) {
        super()
    }

    override toPrint(): string {
        return '@' + this.value
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

    override async execute(
        scope: Scope,
        callFrame: CallFrame,
    ): Promise<ValueType> {
        try {
            const moduleCodeFile = scope.codeFile!.runtime!.getCodeFile(
                this.fileName,
            )
            await moduleCodeFile.run()

            const moduleFileScope = moduleCodeFile.runResult!.scope

            if (this.child instanceof FunctionInvoke) {
                const evaluatedParams = await evaluateParams(
                    this.child.params,
                    scope,
                    callFrame,
                )

                return await this.child.execute(
                    moduleFileScope,
                    callFrame,
                    evaluatedParams,
                )
            }

            return await this.child.execute(moduleFileScope, callFrame)
        } catch (error) {
            if (error instanceof YaksokError) {
                throw new ErrorInModuleError({
                    resource: {
                        fileName: this.fileName,
                    },
                    position: this.tokens[0].position,
                    child: error,
                })
            }

            throw error
        }
    }

    override toPrint(): string {
        return '@' + this.fileName + ' ' + this.child.toPrint()
    }
}
