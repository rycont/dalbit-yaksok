import {
    AlreadyDefinedMemberFunctionError,
    ConstructorArityAmbiguousError,
} from '../../error/class.ts'
import type { YaksokError } from '../../error/common.ts'
import type { Token } from '../../prepare/tokenize/token.ts'
import { DeclareFunction } from '../function.ts'
import type { ClassValue } from './core.ts'
import {
    getDuplicatedConstructorArities,
    isConstructorDeclaration,
} from './constructor.ts'

export function validateDuplicatedConstructorArity(
    className: string,
    classValue: ClassValue,
    tokens: Token[],
): YaksokError[] {
    return getDuplicatedConstructorArities(classValue).map(
        (arity) =>
            new ConstructorArityAmbiguousError({
                resource: {
                    className,
                    arity,
                },
                tokens,
            }),
    )
}

export function validateDuplicatedMemberFunctionName(
    className: string,
    bodyChildren: unknown[],
    tokens: Token[],
): YaksokError[] {
    const functionCountByName = new Map<string, number>()

    for (const child of bodyChildren) {
        if (!(child instanceof DeclareFunction)) continue
        if (isConstructorDeclaration(child)) continue

        functionCountByName.set(
            child.name,
            (functionCountByName.get(child.name) ?? 0) + 1,
        )
    }

    const duplicatedNames = [...functionCountByName.entries()]
        .filter(([, count]) => count > 1)
        .map(([name]) => name)

    return duplicatedNames.map(
        (functionName) =>
            new AlreadyDefinedMemberFunctionError({
                resource: {
                    className,
                    functionName,
                },
                tokens,
            }),
    )
}
