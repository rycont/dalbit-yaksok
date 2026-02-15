import type { Token } from '../../prepare/tokenize/token.ts'
import { extractParamNamesFromHeaderTokens } from '../../util/extract-param-names-from-header-tokens.ts'
import { DeclareFunction } from '../function.ts'
import { ClassValue } from './core.ts'

const CONSTRUCTOR_NAME_PATTERN = /^__준비__(?:\s*\([^)]*\))?$/

export function isConstructorFunctionName(name: string): boolean {
    return CONSTRUCTOR_NAME_PATTERN.test(name)
}

export function extractParamCountFromTokens(allTokens: Token[]): number {
    return extractParamNamesFromHeaderTokens(allTokens).length
}

export function getDeclaredConstructorsInClass(klass: ClassValue): {
    arity: number
}[] {
    const constructors: { arity: number }[] = []

    for (const child of klass.body.children) {
        if (!(child instanceof DeclareFunction)) continue
        if (!isConstructorFunctionName(child.name)) continue

        constructors.push({
            arity: extractParamCountFromTokens(child.tokens),
        })
    }

    return constructors
}
