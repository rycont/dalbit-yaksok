import {
    hasReferenceSlot,
    ReferenceSlot,
    RunFrame,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'
import { Evaluable } from './base'

export class Mention extends Evaluable {
    constructor(
        private instance: Evaluable,
        private declaredFrame: RunFrame,
        public tokens: Token[],
    ) {
        super()
    }

    override execute(runFrame: RunFrame) {
        if (!hasReferenceSlot(this.instance)) {
            return this.instance.execute(runFrame)
        }

        const childFrame = runFrame.createChild(this.instance.scope)
        const reference = this.declaredFrame.get(this.instance[ReferenceSlot])

        childFrame.set(this.instance[ReferenceSlot], reference)
        return this.instance.execute(childFrame)
    }

    override validate(): YaksokError[] {
        return this.instance.validate()
    }
}

export class MentionScope {}
