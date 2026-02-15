import {
    ConstructorArityAmbiguousError,
    ConstructorArityMismatchError,
} from '../../error/class.ts'
import type { YaksokError } from '../../error/common.ts'
import type { Token } from '../../prepare/tokenize/token.ts'
import type { RunnableObject } from '../../value/function.ts'
import type { Scope } from '../../executer/scope.ts'
import type { ClassValue } from './core.ts'
import {
    createConstructorLayersFromInheritanceChain,
    getDeclaredConstructorsInClass,
    resolveConstructorByArity,
} from './constructor.ts'

export function pickConstructorByArity(props: {
    layerScopes: { klass: ClassValue; scope: Scope }[]
    arity: number
    className: string
    tokens: Token[]
}): RunnableObject | undefined {
    const { layerScopes, arity, className, tokens } = props
    const resolution = resolveConstructorByArity(
        layerScopes.map(({ klass }) => ({
            className: klass.name,
            arities: getDeclaredConstructorsInClass(klass).map(
                (constructor) => constructor.arity,
            ),
        })),
        arity,
    )

    if (resolution.kind === 'ambiguous') {
        throw new ConstructorArityAmbiguousError({
            resource: {
                className: resolution.className,
                arity,
            },
            tokens,
        })
    }

    for (let i = layerScopes.length - 1; i >= 0; i--) {
        const { klass, scope } = layerScopes[i]
        const declaredConstructors = getDeclaredConstructorsInClass(klass)
        const matchingDeclaredConstructors = declaredConstructors.filter(
            (constructor) => constructor.arity === arity,
        )

        for (const constructor of matchingDeclaredConstructors) {
            const func = scope.functions.get(constructor.name)
            if (func) {
                return func
            }
        }
    }

    if (resolution.kind === 'none') {
        return undefined
    }

    const expectedArities = resolution.kind === 'mismatch'
        ? resolution.expectedArities
        : [arity]
    throw new ConstructorArityMismatchError({
        resource: {
            className,
            expected: expectedArities,
            received: arity,
        },
        tokens,
    })
}

export function validateConstructorByArity(
    classValue: ClassValue,
    arity: number,
    tokens: Token[],
): YaksokError[] {
    const resolution = resolveConstructorByArity(
        createConstructorLayersFromInheritanceChain(classValue),
        arity,
    )
    if (
        resolution.kind === 'matched' ||
        resolution.kind === 'none' ||
        resolution.kind === 'ambiguous'
    ) {
        return []
    }

    return [
        new ConstructorArityMismatchError({
            resource: {
                className: classValue.name,
                expected: resolution.expectedArities,
                received: arity,
            },
            tokens,
        }),
    ]
}
