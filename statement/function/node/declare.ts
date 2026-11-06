import {
    Executable,
    Block,
    NodeCapability,
    Token,
    Scope,
    YaksokError,
    ValueType,
    EmptyValue,
    Rule,
} from '@dalbit-yaksok/core'
import { MissingFunctionBody } from '../error/no-body'
import { FunctionDeclareHeader } from './header'
import { FunctionObject } from '../value/function'
import { FFIObject } from '../value/ffi'

export class DeclareFunction extends Executable<Block> {
    static override friendlyName = '새 약속 만들기'
    static override accepts = [NodeCapability.RETURN]

    constructor(
        body: Block,
        public readonly header: FunctionDeclareHeader,
        private callingRules: Rule[],
        public override tokens: Token[],
    ) {
        super()
        this.subnode = body
    }

    override execute(scope: Scope): Promise<void> {
        this.header.runScope = scope

        const functionObject = new FunctionObject(
            this.header.signature.functionName,
            this.subnode,
            this.callingRules,
            scope,
        )

        try {
            scope.addFunctionObject(functionObject)
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const declarationErrors = []

        const params: Record<string, ValueType> = Object.fromEntries(
            this.header.signature.parameterScheme.map((p) => [
                p.name,
                p.optional ? new EmptyValue() : new ValueType(),
            ]),
        )

        const functionScope = new Scope({
            parent: scope,
            initialVariable: params,
        })

        try {
            scope.addFunctionObject(
                new FunctionObject(
                    this.header.signature.functionName,
                    this.subnode,
                    this.callingRules,
                    functionScope,
                ),
            )
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                declarationErrors.push(error)
            } else {
                throw error
            }
        }

        const bodyErrors = this.subnode.validate(functionScope)
        const headerErrors = this.header
            .validate(scope)
            .filter((e) => !(e instanceof MissingFunctionBody))

        return declarationErrors.concat(headerErrors).concat(bodyErrors)
    }
}

export class DeclareFFI extends Executable {
    static override friendlyName = '번역 만들기'

    constructor(
        private callingRules: Rule[],
        public readonly header: FunctionDeclareHeader,
        public runtime: string,
        public body: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(scope: Scope): Promise<void> {
        try {
            scope.addFunctionObject(
                new FFIObject(
                    this.header.signature.functionName,
                    this.body,
                    this.runtime,
                    this.callingRules,
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
                this.header.signature.functionName,
                this.body,
                this.runtime,
                this.callingRules,
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

        const headerErrors = this.header
            .validate(scope)
            .filter((e) => !(e instanceof MissingFunctionBody))

        return declareErrors.concat(headerErrors)
    }
}

export class DeclareEvent extends Executable {
    static override friendlyName = '새 이벤트 만들기'

    constructor(
        public readonly header: FunctionDeclareHeader,
        private readonly eventId: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(scope: Scope): Promise<void> {
        scope.events.set(this.eventId, this)
        return Promise.resolve()
    }

    override validate(scope: Scope): YaksokError[] {
        return this.header
            .validate(scope)
            .filter((e) => !(e instanceof MissingFunctionBody))
    }
}
