import { DotAccessOnlyOnInstanceError } from '../../error/class.ts'
import { NotDefinedIdentifierError } from '../../error/variable.ts'
import type { Token } from '../../prepare/tokenize/token.ts'
import type { RunnableObject } from '../../value/function.ts'
import { ValueType } from '../../value/base.ts'
import { Scope } from '../../executer/scope.ts'
import { InstanceValue, SuperValue } from './core.ts'

export type MemberAccessTarget = InstanceValue | SuperValue

export function resolveMemberAccessTarget(
    target: ValueType,
    tokens: Token[],
): { scope: Scope; instance: InstanceValue } {
    if (target instanceof InstanceValue) {
        return {
            scope: target.scope,
            instance: target,
        }
    }

    if (target instanceof SuperValue) {
        return {
            scope: target.scope,
            instance: target.instance,
        }
    }

    throw new DotAccessOnlyOnInstanceError({
        tokens,
    })
}

export function findMemberFunction(
    scope: Scope,
    instance: InstanceValue,
    functionName: string,
): RunnableObject | undefined {
    let cursor: Scope | undefined = scope

    while (cursor) {
        const fromCurrentScope = cursor.functions.get(functionName)
        if (fromCurrentScope) {
            return fromCurrentScope
        }
        if (cursor === instance.memberLookupRootScope) {
            break
        }
        cursor = cursor.parent
    }

    return undefined
}

export function findVariableOwnerScopeInMemberChain(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
): Scope | undefined {
    let cursor: Scope | undefined = scope

    while (cursor) {
        if (memberName in cursor.variables) {
            return cursor
        }
        if (cursor === instance.memberLookupRootScope) {
            break
        }
        cursor = cursor.parent
    }

    return undefined
}

export function getMemberVariable(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
    tokens: Token[],
): ValueType {
    const owner = findVariableOwnerScopeInMemberChain(
        scope,
        instance,
        memberName,
    )

    if (!owner) {
        const error = new NotDefinedIdentifierError({
            resource: {
                name: memberName,
            },
        })
        error.tokens = tokens
        throw error
    }

    return owner.getVariable(memberName, tokens)
}

export function setMemberVariable(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
    value: ValueType,
    tokens: Token[],
): void {
    const owner = findVariableOwnerScopeInMemberChain(
        scope,
        instance,
        memberName,
    )

    if (owner) {
        owner.setLocalVariable(memberName, value, tokens)
        return
    }

    scope.setLocalVariable(memberName, value, tokens)
}
