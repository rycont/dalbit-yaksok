import { Scope } from '../../executer/scope.ts'
import { ValueType } from '../../value/base.ts'
import { FunctionObject } from '../../value/function.ts'
import { extractParamNamesFromHeaderTokens } from '../../util/extract-param-names-from-header-tokens.ts'
import { DeclareFunction } from '../function.ts'
import {
    ClassValue,
    getInheritanceChain,
    InstanceValue,
    SuperValue,
} from './core.ts'
import {
    extractParamCountFromTokens,
    isConstructorDeclaration,
} from './constructor.ts'
import { collectGuaranteedMemberWritesFromBlock } from './validation-analysis.ts'

export function createClassInstanceLayerScopes(classValue: ClassValue): {
    instance: InstanceValue
    layerScopes: { klass: ClassValue; scope: Scope }[]
    finalScope: Scope
} {
    const rootScope = new Scope({
        parent: classValue.definitionScope,
        allowFunctionOverride: true,
    })

    const instance = new InstanceValue(classValue.name)
    instance.classValue = classValue
    instance.memberLookupRootScope = rootScope

    let currentScope = rootScope
    const layerScopes: { klass: ClassValue; scope: Scope }[] = []

    for (const klass of getInheritanceChain(classValue)) {
        const layerScope = new Scope({
            parent: currentScope,
            allowFunctionOverride: true,
        })

        layerScope.setLocalVariable('자신', instance)
        if (klass.parentClass) {
            layerScope.setLocalVariable(
                '상위',
                new SuperValue(instance, currentScope),
            )
        }

        layerScopes.push({
            klass,
            scope: layerScope,
        })
        currentScope = layerScope
    }

    return {
        instance,
        layerScopes,
        finalScope: currentScope,
    }
}

export function createValidationInstanceFromClass(
    classValue: ClassValue,
    constructorArity?: number,
): InstanceValue {
    const { instance, layerScopes, finalScope } =
        createClassInstanceLayerScopes(classValue)

    for (const { klass, scope } of layerScopes) {
        for (const child of klass.body.children) {
            if (!(child instanceof DeclareFunction)) continue

            const paramNames =
                child.paramNames ??
                extractParamNamesFromHeaderTokens(child.tokens)
            scope.addFunctionObject(
                new FunctionObject(child.name, child.body, scope, paramNames),
            )
        }
    }

    for (let i = 0; i < layerScopes.length; i++) {
        const current = layerScopes[i]
        const parentScope = i > 0 ? layerScopes[i - 1].scope : undefined
        const deterministicWrites = collectGuaranteedMemberWritesFromBlock(
            current.klass.body,
            {
                includePlainSetVariable: true,
            },
        )

        for (const write of deterministicWrites) {
            const ownerScope =
                write.target === 'super'
                    ? (parentScope ?? current.scope)
                    : current.scope
            ownerScope.setLocalVariable(write.name, new ValueType())
        }
    }

    if (constructorArity !== undefined) {
        for (let i = layerScopes.length - 1; i >= 0; i--) {
            const current = layerScopes[i]
            const parentScope = i > 0 ? layerScopes[i - 1].scope : undefined
            const constructors = current.klass.body.children.filter(
                (child): child is DeclareFunction =>
                    child instanceof DeclareFunction &&
                    isConstructorDeclaration(child),
            )

            const matchingConstructors = constructors.filter(
                (constructor) =>
                    extractParamCountFromTokens(constructor.tokens) ===
                    constructorArity,
            )

            if (matchingConstructors.length !== 1) {
                continue
            }

            const deterministicWrites = collectGuaranteedMemberWritesFromBlock(
                matchingConstructors[0].body,
                {
                    includePlainSetVariable: false,
                },
            )

            for (const write of deterministicWrites) {
                const ownerScope =
                    write.target === 'super'
                        ? (parentScope ?? current.scope)
                        : current.scope
                ownerScope.setLocalVariable(write.name, new ValueType())
            }

            break
        }
    }

    instance.scope = finalScope
    return instance
}
