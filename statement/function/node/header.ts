import {
    Token,
    YaksokError,
    Scope,
    RESERVED_WORDS,
    NotProperIdentifierNameToDefineError,
    Statement,
} from '@dalbit-yaksok/core'

import { FunctionPartType, FunctionSignature } from '../type.ts'
import { RequiredParametersShouldPriorError } from '../error/required-parameter.ts'
import { FunctionMustHaveSignature } from '../error/no-signature.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../error/no-static.ts'
import { MissingFunctionBody } from '../error/no-body.ts'

export class FunctionDeclareHeader implements Statement {
    public parsingErrors: YaksokError[] = []

    constructor(
        public signature: FunctionSignature,
        public tokens: Token[],
        public scope: Scope,
    ) {}

    public injectError(error: YaksokError) {
        this.parsingErrors.push(error)
    }

    execute(): Promise<void> {
        throw this.validate()[0]
    }

    validate(): YaksokError[] {
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
                        scope: this.scope,
                    }),
            )

        const signatureError =
            this.signature.headerParts.length === 0
                ? [
                      new FunctionMustHaveSignature({
                          statement: this,
                          scope: this.scope,
                          tokens: this.tokens,
                      }),
                  ]
                : this.signature.headerParts.some(
                        (p) => p.type === FunctionPartType.static,
                    )
                  ? []
                  : [
                        new FunctionMustHaveOneOrMoreStringPartError({
                            scope: this.scope,
                            statement: this,
                            tokens: this.tokens,
                        }),
                    ]

        for (const e of this.parsingErrors) {
            e.scope = this.scope
        }

        return this.parsingErrors
            .concat(parameterOrderErrors)
            .concat(invalidNames)
            .concat(signatureError)
            .concat(
                new MissingFunctionBody({
                    statement: this,
                }),
            )
    }
}
