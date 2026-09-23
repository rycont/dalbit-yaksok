import {
    Executable,
    Node,
    Rule,
    Scope,
    Token,
    YaksokError,
    FFIObject,
} from '@dalbit-yaksok/core'

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
    private invokeRules: Rule[]

    constructor(
        props: {
            name: string
            invokeRules: Rule[]
            body: string
            runtime: string
        },
        public override tokens: Token[],
    ) {
        super()
        this.name = props.name
        this.body = props.body
        this.runtime = props.runtime
        this.invokeRules = props.invokeRules
    }

    override execute(scope: Scope): Promise<void> {
        try {
            scope.addFunctionObject(
                new FFIObject(
                    this.name,
                    this.body,
                    this.runtime,
                    this.invokeRules,
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
        try {
            const ffiObject = new FFIObject(
                this.name,
                this.body,
                this.runtime,
                this.invokeRules,
                scope,
            )

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
