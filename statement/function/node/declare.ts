import {
    Block,
    NodeCapability,
    Token,
    Scope,
    YaksokError,
    ValueType,
    EmptyValue,
    RuleList,
    Statement,
} from '@dalbit-yaksok/core'
import { MissingFunctionBody } from '../error/no-body'
import { FunctionDeclareHeader } from './header'
import { FunctionObject } from '../value/function'
import { FFIObject } from '../value/ffi'
import { EventSubscriptionObject } from '../value/event'

export class DeclareFunction implements Statement {
    static friendlyName = '새 약속 만들기'
    static accepts = [NodeCapability.RETURN]

    constructor(
        private body: Block,
        public readonly header: FunctionDeclareHeader,
        private callingRules: RuleList,
        public tokens: Token[],
    ) {}

    execute(scope: Scope): Promise<void> {
        const functionObject = new FunctionObject(
            this.header.signature.functionName,
            this.body,
            this.callingRules,
            scope,
        )

        this.header.runnable = functionObject

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

    validate(scope: Scope): YaksokError[] {
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
                    this.body,
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

        const bodyErrors = this.body.validate(functionScope)
        const headerErrors = this.header
            .validate(scope)
            .filter((e) => !(e instanceof MissingFunctionBody))

        return declarationErrors.concat(headerErrors).concat(bodyErrors)
    }
}

export class DeclareFFI implements Statement {
    static friendlyName = '번역 만들기'

    constructor(
        private callingRules: RuleList,
        public readonly header: FunctionDeclareHeader,
        public runtime: string,
        public body: string,
        public tokens: Token[],
    ) {}

    public parsingErrors: YaksokError[] = []

    execute(scope: Scope): Promise<void> {
        try {
            const runnable = new FFIObject(
                this.header.signature.functionName,
                this.body,
                this.runtime,
                this.callingRules,
                scope,
            )

            this.header.runnable = runnable
            scope.addFunctionObject(runnable)
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    validate(scope: Scope): YaksokError[] {
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

        return declareErrors.concat(headerErrors).concat(
            this.parsingErrors.map((e) => {
                e.scope = scope
                return e
            }),
        )
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}

export class DeclareEvent implements Statement {
    static friendlyName = '새 이벤트 만들기'

    constructor(
        private callingRules: RuleList,
        public readonly header: FunctionDeclareHeader,
        private readonly eventId: string,
        public tokens: Token[],
    ) {}

    execute(scope: Scope): Promise<void> {
        scope.events.set(this.eventId, this)

        this.header.runnable = new EventSubscriptionObject(
            this.eventId,
            this.callingRules,
            scope,
        )

        return Promise.resolve()
    }

    validate(scope: Scope): YaksokError[] {
        return this.header
            .validate(scope)
            .filter((e) => !(e instanceof MissingFunctionBody))
    }
}
