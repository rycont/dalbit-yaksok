import {
    NotDefinedFunctionError,
    NotDefinedVariableError,
} from '../error/index.ts'
import { Yaksok } from '../index.ts'
import { DeclareFFI, DeclareFunction, ValueTypes } from '../node/index.ts'

export class Scope {
    variables: Record<string, ValueTypes>
    functions: Record<string, DeclareFunction | DeclareFFI> = {}
    parent: Scope | undefined
    runtime?: Yaksok

    constructor(
        config: {
            parent?: Scope
            runtime?: Yaksok
            initialVariable?: Record<string, ValueTypes>
        } = {},
    ) {
        this.variables = config.initialVariable || {}
        this.parent = config.parent
        this.runtime = config.runtime

        if (config.parent?.runtime) {
            this.runtime = config.parent.runtime
        }
    }

    setVariable(name: string, value: ValueTypes) {
        if (this.parent?.askSetVariable(name, value)) return
        this.variables[name] = value
    }

    askSetVariable(name: string, value: ValueTypes): boolean {
        if (name in this.variables) {
            this.variables[name] = value
            return true
        }

        if (this.parent) return this.parent.askSetVariable(name, value)
        return false
    }

    getVariable(name: string): ValueTypes {
        if (name in this.variables) {
            return this.variables[name]
        }
        if (this.parent) {
            return this.parent.getVariable(name)
        }

        throw new NotDefinedVariableError({
            resource: {
                name,
            },
        })
    }

    setFunction(name: string, functionBody: DeclareFunction | DeclareFFI) {
        this.functions[name] = functionBody
    }

    getFunction(name: string): DeclareFunction | DeclareFFI {
        const fetched = this.functions[name]
        if (fetched) return fetched

        if (this.parent) {
            return this.parent.getFunction(name)
        }

        throw new NotDefinedFunctionError({
            resource: {
                name,
            },
        })
    }

    createChild(initialVariable?: Record<string, ValueTypes>) {
        return new Scope({
            parent: this,
            initialVariable,
        })
    }
}
