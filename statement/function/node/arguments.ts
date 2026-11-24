import {
    Evaluable,
    ValueType,
    YaksokError,
    EmptyValue,
    Scope,
    UnexpectedArgumentError,
    Token,
    SlotKey,
    RunFrame,
} from '@dalbit-yaksok/core'

import { MissingRequiredArgumentError } from '../error/missing-required'
import { ParameterElement } from '../type'

export class InvokingArguments {
    private readonly optionalFiller: [SlotKey, ValueType][]

    constructor(
        public readonly scope: Scope,
        public readonly parameterScheme: ParameterElement[],
        public readonly parameterSlots: Map<ParameterElement, SlotKey>,
        public readonly argumentValues: Map<SlotKey, Evaluable>,
        public readonly tokens: Token[],
        public readonly parsingErrors: YaksokError[],
    ) {
        const optionalKeys = new Set(
            parameterScheme
                .filter((p) => p.optional)
                .map((p) => parameterSlots.get(p)!),
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

    async execute(runFrame: RunFrame): Promise<Map<SlotKey, ValueType>> {
        const args = new Map(
            this.optionalFiller.concat(
                await Promise.all(
                    this.argumentValues
                        .entries()
                        .map<Promise<[SlotKey, ValueType]>>(async ([k, v]) => [
                            k,
                            await v.execute(runFrame),
                        ])
                        .toArray(),
                ),
            ),
        )

        return args
    }

    validate(): YaksokError[] {
        const argumentErrors = this.argumentValues
            .values()
            .flatMap((e) => e.validate())

        const providedArguments = new Set(this.argumentValues.keys())

        const requiredArguments = new Set(
            this.parameterScheme
                .filter((p) => !p.optional)
                .map((p) => this.parameterSlots.get(p)!),
        )

        const missingKeys = new Set(requiredArguments).difference(
            providedArguments,
        )

        const missingKeysError = missingKeys.size
            ? [
                  new MissingRequiredArgumentError({
                      tokens: this.tokens,
                      resource: {
                          names: Array.from(missingKeys).map(
                              (k) => k.description!,
                          ),
                      },
                      scope: this.scope,
                  }),
              ]
            : []

        const knownKeys = new Set(this.parameterSlots.values())
        const unknownKeys = Array.from(providedArguments.difference(knownKeys))

        const unknownKeysError = unknownKeys.length
            ? [
                  new UnexpectedArgumentError({
                      tokens: this.argumentValues.get(unknownKeys[0])!.tokens,
                      resource: {
                          names: unknownKeys.map((k) => k.description!),
                      },
                      scope: this.scope,
                  }),
              ]
            : []

        for (const e of this.parsingErrors) {
            e.scope = this.scope
        }

        return argumentErrors
            .toArray()
            .concat(missingKeysError)
            .concat(unknownKeysError)
            .concat(this.parsingErrors)
    }
}
