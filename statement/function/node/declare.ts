import {
    Block,
    NodeCapability,
    Token,
    Scope,
    YaksokError,
    RuleList,
    Statement,
} from '@dalbit-yaksok/core'
import { MissingFunctionBody } from '../error/no-body'
import { FunctionDeclareHeader } from './header'
import { FFIObject } from '../value/ffi'
// import { EventSubscriptionObject } from '../value/event'

export class DeclareFunction implements Statement {
    static friendlyName = '새 약속 만들기'
    static accepts = [NodeCapability.RETURN]

    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public tokens: Token[],
    ) {}

    execute() {
        return Promise.resolve()
    }

    validate() {
        return []
    }
}

export class DeclareFFI implements Statement {
    static friendlyName = '번역 만들기'

    constructor(
        public scope: Scope,
        private callingRules: RuleList,
        public readonly header: FunctionDeclareHeader,
        public runtime: string,
        public body: string,
        public tokens: Token[],
    ) {}

    public parsingErrors: YaksokError[] = []

    execute(): Promise<void> {
        try {
            const runnable = new FFIObject(
                this.header.signature.functionName,
                this.body,
                this.runtime,
                this.callingRules,
                this.scope,
            )

            this.scope.addFunctionObject(runnable)
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    validate(): YaksokError[] {
        let declareErrors: YaksokError[] = []

        try {
            const ffiObject = new FFIObject(
                this.header.signature.functionName,
                this.body,
                this.runtime,
                this.callingRules,
                this.scope,
            )

            this.scope.addFunctionObject(ffiObject)
        } catch (error) {
            if (error instanceof YaksokError) {
                error.tokens = this.tokens
                declareErrors.push(error)
            } else {
                throw error
            }
        }

        const headerErrors = this.header
            .validate()
            .filter((e) => !(e instanceof MissingFunctionBody))

        return declareErrors.concat(headerErrors).concat(
            this.parsingErrors.map((e) => {
                e.scope = this.scope
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
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        private callingRules: RuleList,
        public readonly header: FunctionDeclareHeader,
        private readonly eventId: string,
        public tokens: Token[],
    ) {}

    execute(): Promise<void> {
        this.scope.events.set(this.eventId, this)

        // this.header.runnable = new EventSubscriptionObject(
        //     this.eventId,
        //     this.callingRules,
        //     scope,
        // )

        return Promise.resolve()
    }

    validate(): YaksokError[] {
        return this.header
            .validate()
            .filter((e) => !(e instanceof MissingFunctionBody))
    }
}
