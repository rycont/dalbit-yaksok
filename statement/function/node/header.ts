import {
    Token,
    YaksokError,
    Scope,
    RESERVED_WORDS,
    NotProperIdentifierNameToDefineError,
    RunnableObject,
    Statement,
} from '@dalbit-yaksok/core'

import { FunctionPartType, FunctionSignature } from '../type.ts'
import { RequiredParametersShouldPriorError } from '../error/required-parameter.ts'
import { FunctionMustHaveSignature } from '../error/no-signature.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../error/no-static.ts'
import { MissingFunctionBody } from '../error/no-body.ts'

export class FunctionDeclareHeader implements Statement {
    private injectedErrors: YaksokError[] = []
    public runnable?: RunnableObject = undefined

    constructor(
        public signature: FunctionSignature,
        public tokens: Token[],
    ) {}

    public injectError(error: YaksokError) {
        this.injectedErrors.push(error)
    }

    execute(scope: Scope): Promise<void> {
        throw this.validate(scope)[0]
    }

    validate(scope: Scope): YaksokError[] {
        const firstOptionalParameter = this.signature.parameterScheme.findIndex(
            (s) => s.optional,
        )
        const lastRequiredParameter =
            this.signature.parameterScheme.findLastIndex((s) => !s.optional)

        const isInvalidOrder =
            lastRequiredParameter !== -1 &&
            firstOptionalParameter !== -1 &&
            firstOptionalParameter < lastRequiredParameter

        const parameterOrderErrors = isInvalidOrder
            ? [
                  new RequiredParametersShouldPriorError({
                      tokens: this.signature.parameterScheme[
                          lastRequiredParameter
                      ].tokens,
                      scope,
                  }),
              ]
            : []

        const invalidNames = this.signature.headerParts
            .filter((p) => p.type === FunctionPartType.static)
            .flatMap((p) => p.names.filter((n) => RESERVED_WORDS.has(n.value)))
            .map(
                (t) =>
                    new NotProperIdentifierNameToDefineError({
                        tokens: [t],
                        scope,
                    }),
            )

        const signatureError =
            this.signature.headerParts.length === 0
                ? [
                      new FunctionMustHaveSignature({
                          statement: this,
                          scope,
                          tokens: this.tokens,
                      }),
                  ]
                : this.signature.headerParts.some(
                        (p) => p.type === FunctionPartType.static,
                    )
                  ? []
                  : [
                        new FunctionMustHaveOneOrMoreStringPartError({
                            scope,
                            statement: this,
                            tokens: this.tokens,
                        }),
                    ]

        for (const e of this.injectedErrors) {
            e.scope = scope
        }

        return this.injectedErrors
            .concat(parameterOrderErrors)
            .concat(invalidNames)
            .concat(signatureError)
            .concat(
                new MissingFunctionBody({
                    statement: this,
                    scope,
                }),
            )
    }
}
