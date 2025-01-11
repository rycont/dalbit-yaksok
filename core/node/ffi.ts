import { FFIObject } from '../value/ffi.ts'
import { Executable, Node } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Position } from '../type/position.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export class FFIBody extends Node {
    static override friendlyName = '번역할 내용'

    constructor(public code: string, public override tokens: Token[]) {
        super()
    }
}

export class DeclareFFI extends Executable {
    static override friendlyName = '번역 만들기'

    public name: string
    public body: string
    public runtime: string

    constructor(
        props: {
            name: string
            body: string
            runtime: string
            position?: Position
        },
        public override tokens: Token[],
    ) {
        super()
        this.name = props.name
        this.body = props.body
        this.runtime = props.runtime
        this.position = props.position
    }

    override execute(scope: Scope): Promise<void> {
        scope.addFunctionObject(this.toFFIObject(scope))
        return Promise.resolve()
    }

    toFFIObject(scope: Scope): FFIObject {
        const codeFile = scope.codeFile
        return new FFIObject(this.name, this.body, this.runtime, codeFile)
    }
}
