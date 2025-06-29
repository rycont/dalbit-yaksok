import { NotDefinedIdentifierError } from '../error/index.ts'
import { ValueType } from '../value/base.ts'

import type { CodeFile } from '../type/code-file.ts'
import type { RunnableObject } from '../value/function.ts'

export class Scope {
    variables: Record<string, ValueType>
    parent: Scope | undefined
    codeFile?: CodeFile
    private functions: Map<string, RunnableObject> = new Map()

    constructor(
        config: {
            parent?: Scope
            codeFile?: CodeFile
            initialVariable?: Record<string, ValueType> | null
        } = {},
    ) {
        this.variables = config.initialVariable || {}

        if (config.parent) {
            this.parent = config.parent
        }

        if (config.codeFile) {
            this.codeFile = config.codeFile
        } else if (config.parent?.codeFile) {
            this.codeFile = config.parent.codeFile
        }

        if (!config.parent && config.codeFile) {
            this.parent = config.codeFile.session?.baseContext?.ranScope!
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

    getVariable(name: string): ValueType {
        if (name in this.variables) {
            return this.variables[name]
        }

        if (this.parent) {
            return this.parent.getVariable(name)
        }

        const errorInstance = new NotDefinedIdentifierError({
            resource: {
                name,
            },
        })

        errorInstance.codeFile = this.codeFile
        throw errorInstance
    }

    addFunctionObject(functionObject: RunnableObject) {
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
        })

        errorInstance.codeFile = this.codeFile
        throw errorInstance
    }
}
