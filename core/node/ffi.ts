import {
    Executable,
    Node,
    Scope,
    Token,
    YaksokError,
    FFIObject,
    FunctionDeclareHeader,
} from '@dalbit-yaksok/core'
import { FunctionType } from '../prepare/parse/dynamicRule/local/type.ts'

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

    constructor(
        public readonly header: FunctionDeclareHeader<FunctionType.번역>,
        public body: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(scope: Scope): Promise<void> {
        try {
            scope.addFunctionObject(
                new FFIObject(
                    this.header.name,
                    this.body,
                    this.header.range.runtime,
                    this.header.invokingRules,
                    scope,
                ),
            )
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        let declareErrors: YaksokError[] = []
        try {
            const ffiObject = new FFIObject(
                this.header.name,
                this.body,
                this.header.range.runtime,
                this.header.invokingRules,
                scope,
            )

            scope.addFunctionObject(ffiObject)
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                declareErrors.push(error)
            } else {
                throw error
            }
        }

        const headerErrors = this.header.validate(scope)

        return declareErrors.concat(headerErrors)
    }
}
