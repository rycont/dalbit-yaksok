import { YaksokError } from '../error/common.ts'
import { FFIObject } from '../value/ffi.ts'
import { Executable, Node } from './base.ts'

import { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Position } from '../type/position.ts'

export class FFIBody extends Node {
    static override friendlyName = '번역할 내용'

    constructor(
        public code: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class DeclareFFI extends Executable {
    static override friendlyName = '번역 만들기'

    public name: string
    public body: string
    public runtime: string
    public paramNames: string[]
    public dotReceiverTypeNames?: string[]

    constructor(
        props: {
            name: string
            body: string
            runtime: string
            paramNames?: string[]
            dotReceiverTypeNames?: string[]
            position?: Position
        },
        public override tokens: Token[],
    ) {
        super()
        this.name = props.name
        this.body = props.body
        this.runtime = props.runtime
        this.paramNames = props.paramNames || []
        this.dotReceiverTypeNames = props.dotReceiverTypeNames
        this.position = props.position
    }

    override execute(scope: Scope): Promise<void> {
        try {
            scope.addFunctionObject(this.toFFIObject(scope))
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    toFFIObject(scope: Scope): FFIObject {
        const codeFile = scope.codeFile
        const ffiObject = new FFIObject(
            this.name,
            this.body,
            this.runtime,
            codeFile,
            {
                dotReceiverTypeNames: this.dotReceiverTypeNames,
            },
        )
        ffiObject.paramNames = this.paramNames
        return ffiObject
    }

    override validate(scope: Scope): YaksokError[] {
        try {
            const ffiObject = new FFIObject(
                this.name,
                'VALIDATION',
                'VALIDATION',
                undefined,
                {
                    dotReceiverTypeNames: this.dotReceiverTypeNames,
                },
            )
            ffiObject.paramNames = this.paramNames
            scope.addFunctionObject(ffiObject)
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                return [error]
            } else {
                throw error
            }
        }

        return []
    }
}
