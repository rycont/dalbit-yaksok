import {
    ErrorInModuleError,
    hasReferenceSlot,
    ReferenceSlot,
    RunFrame,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { Evaluable } from './base'

export class Mention extends Evaluable {
    constructor(
        private fileName: string,
        private instance: Evaluable,
        private declaredFrame: RunFrame,
        public tokens: Token[],
    ) {
        super()
    }

    override async execute(runFrame: RunFrame) {
        try {
            if (!hasReferenceSlot(this.instance)) {
                return await this.instance.execute(runFrame)
            }

            const childFrame = runFrame.createChild(this.instance.scope)
            const reference = this.declaredFrame.get(
                this.instance[ReferenceSlot],
            )

            childFrame.set(this.instance[ReferenceSlot], reference)
            return await this.instance.execute(childFrame)
        } catch (e) {
            if (e instanceof YaksokError) {
                throw new ErrorInModuleError({
                    child: e,
                    resource: {
                        fileName: this.fileName,
                    },
                    tokens: this.tokens,
                })
            }

            throw e
        }
    }

    override validate(): YaksokError[] {
        return this.instance.validate()
    }
}
