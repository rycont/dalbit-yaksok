import {
    AlreadyDefinedFunctionError,
    NotDefinedIdentifierError,
    Rule,
    Token,
    ValueType,
    YaksokSession,
    RunnableObject,
    Identifier,
    DeclareEvent,
    NotProperIdentifierNameToDefineError,
} from '@dalbit-yaksok/core'
import { RESERVED_WORDS } from '../constant/reserved-words.ts'

export class Scope {
    variables: Record<string, ValueType>
    parent: Scope | null

    public readonly id: string = crypto.randomUUID()
    public readonly functions: Map<string, RunnableObject> = new Map()
    public readonly events: Map<string, DeclareEvent> = new Map()

    public readonly session: YaksokSession

    constructor(
        config: (
            | {
                  session: YaksokSession
              }
            | {
                  parent: Scope
              }
        ) & {
            initialVariable?: Record<string, ValueType> | null
        },
    ) {
        this.variables = config.initialVariable || Object.create(null)

        if ('session' in config) {
            this.parent = config.session.baseScope
            this.session = config.session
        } else {
            this.parent = config.parent
            this.session = config.parent.session
        }
    }

    setVariable(name: string, value: ValueType) {
        if (this.parent?.askSetVariable(name, value)) {
            return
        }

        if (RESERVED_WORDS.has(name)) {
            throw new NotProperIdentifierNameToDefineError()
        }

        this.variables[name] = value
    }

    askSetVariable(name: string, value: ValueType): boolean {
        if (name in this.variables) {
            this.variables[name] = value
            return true
        }

        if (this.parent) return this.parent.askSetVariable(name, value)
        return false
    }

    getVariable(name: string, tokens?: Token[]): ValueType {
        if (name in this.variables) {
            const value = this.variables[name]
            return value
        }

        if (this.parent) {
            return this.parent.getVariable(name, tokens)
        }

        const errorInstance = new NotDefinedIdentifierError({
            resource: {
                name,
            },
            scope: this,
        })

        throw errorInstance
    }

    public *getAccessibleNames(): Generator<string> {
        for (const key in this.variables) {
            yield key
        }

        if (this.parent) {
            yield* this.parent.getAccessibleNames()
        }
    }

    addFunctionObject(functionObject: RunnableObject) {
        if (this.functions.has(functionObject.name)) {
            const errorInstance = new AlreadyDefinedFunctionError({
                resource: {
                    name: functionObject.name,
                },
                scope: this,
            })

            throw errorInstance
        }
        this.functions.set(functionObject.name, functionObject)
    }

    getFunctionObject(name: string): RunnableObject {
        const fromCurrentScope = this.functions.get(name)
        if (fromCurrentScope) return fromCurrentScope

        if (this.parent) {
            return this.parent.getFunctionObject(name)
        }

        const errorInstance = new NotDefinedIdentifierError({
            resource: {
                name,
            },
            scope: this,
        })

        throw errorInstance
    }

    public *getExportedRules(): Generator<Rule> {
        yield* this.parent?.getExportedRules() || []
        yield* Object.keys(this.variables).map<Rule>((v) => ({
            pattern: [
                {
                    type: Identifier,
                    value: v,
                },
            ],
            factory([node]) {
                return node
            },
        }))
        yield* this.functions.values().flatMap((v) => v.invokeRules)
    }
}
