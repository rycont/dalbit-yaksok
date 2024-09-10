import { CallFrame } from '../runtime/callFrame.ts'
import { Scope } from '../runtime/scope.ts'
import { Evaluable } from './base.ts'

export class ValueWithBracket extends Evaluable {
    constructor(public value: Evaluable) {
        super()
    }

    execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        return this.value.execute(scope, callFrame)
    }

    toPrint(): string {
        return `${this.value.toPrint()}`
    }
}