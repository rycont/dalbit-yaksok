import { Scope } from '../runtime/scope.ts'
import { ReturnSignal } from '../runtime/signals.ts'
import { Executable } from './base.ts'

export class Return extends Executable {
    execute(_scope: Scope) {
        throw new ReturnSignal(this.position)
    }
}
