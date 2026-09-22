import {
    AlreadyDefinedFunctionError,
    NotDefinedIdentifierError,
    Rule,
    Token,
    ValueType,
    YaksokSession,
    RunnableObject,
    Identifier,
} from '@dalbit-yaksok/core'

export class Scope {
    variables: Record<string, ValueType>
    parent: Scope | undefined

    public id: string = crypto.randomUUID()
    public functions: Map<string, RunnableObject> = new Map()
    public readonly session?: YaksokSession

    constructor(
        config: {
            parent?: Scope
            initialVariable?: Record<string, ValueType> | null
            session?: YaksokSession
        } = {},
    ) {
        this.variables = config.initialVariable || Object.create(null)

        if (config.parent) {
            this.parent = config.parent
        }

        if (config.session) {
            this.session = config.session
        } else if (this.parent?.session) {
            this.session = this.parent.session
        }
    }

    setVariable(name: string, value: ValueType) {
        if (this.parent?.askSetVariable(name, value)) return
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
