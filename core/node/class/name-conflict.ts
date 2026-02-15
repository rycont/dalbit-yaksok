import { NotDefinedIdentifierError } from '../../error/variable.ts'
import { Scope } from '../../executer/scope.ts'
import { ValueType } from '../../value/base.ts'
import type { RunnableObject } from '../../value/function.ts'

function resolveExistingIdentifierValue(
    scope: Scope,
    name: string,
): ValueType | undefined {
    try {
        return scope.getVariable(name)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}

function resolveExistingFunctionObject(
    scope: Scope,
    name: string,
): RunnableObject | undefined {
    try {
        return scope.getFunctionObject(name)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}

export function hasExistingClassNameConflict(scope: Scope, name: string): boolean {
    return (
        resolveExistingIdentifierValue(scope, name) !== undefined ||
        resolveExistingFunctionObject(scope, name) !== undefined
    )
}
