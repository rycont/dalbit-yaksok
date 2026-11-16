import {
    Evaluable,
    ValueType,
    YaksokError,
    EmptyValue,
    Scope,
    UnexpectedArgumentError,
    Token,
} from '@dalbit-yaksok/core'

import { MissingRequiredArgumentError } from '../error/missing-required'
import { ParameterElement } from '../type'

export class InvokingArguments {
    private readonly optionalFiller: [string, ValueType][]

    constructor(
        public readonly argumentValues: Map<string, Evaluable>,
        public readonly parameterScheme: ParameterElement[],
        public readonly tokens: Token[],
        public readonly parsingErrors: YaksokError[],
    ) {
        const optionalKeys = new Set(
            parameterScheme.filter((p) => p.optional).map((p) => p.name),
        )
        const providedKeys = new Set(argumentValues.keys())

        const missingOptionals = Array.from(
            optionalKeys.difference(providedKeys),
        )

        this.optionalFiller = missingOptionals.map((key) => [
            key,
            new EmptyValue(),
        ])
    }

    async execute(scope: Scope): Promise<Map<string, ValueType>> {
        const args = new Map(
            this.optionalFiller.concat(
                await Promise.all(
                    this.argumentValues
                        .entries()
                        .map<Promise<[string, ValueType]>>(async ([k, v]) => [
                            k,
                            await v.execute(scope),
                        ])
                        .toArray(),
                ),
            ),
        )

        return args
    }

    validate(invokingScope: Scope): YaksokError[] {
        const argumentErrors = this.argumentValues
            .values()
            .flatMap((e) => e.validate(invokingScope))

        const providedArguments = new Set(this.argumentValues.keys())

        const requiredArguments = new Set(
            this.parameterScheme.filter((p) => !p.optional).map((p) => p.name),
        )

        const missingKeys = new Set(requiredArguments).difference(
            providedArguments,
        )

        const missingKeysError = missingKeys.size
            ? [
                  new MissingRequiredArgumentError({
                      tokens: this.tokens,
                      resource: {
                          names: Array.from(missingKeys),
                      },
                      scope: invokingScope,
                  }),
              ]
            : []

        const knownKeys = new Set(this.parameterScheme.map((p) => p.name))
        const unknownKeys = Array.from(providedArguments.difference(knownKeys))

        const unknownKeysError = unknownKeys.length
            ? [
                  new UnexpectedArgumentError({
                      tokens: this.argumentValues.get(unknownKeys[0])!.tokens,
                      resource: {
                          names: unknownKeys,
                      },
                      scope: invokingScope,
                  }),
              ]
            : []

        for (const e of this.parsingErrors) {
            e.scope = invokingScope
        }

        return argumentErrors
            .toArray()
            .concat(missingKeysError)
            .concat(unknownKeysError)
            .concat(this.parsingErrors)
    }
}
