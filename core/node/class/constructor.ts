import type { Token } from '../../prepare/tokenize/token.ts'
import { TOKEN_TYPE } from '../../prepare/tokenize/token.ts'
import { extractParamNamesFromHeaderTokens } from '../../util/extract-param-names-from-header-tokens.ts'
import { DeclareFunction } from '../function.ts'
import { ClassValue, getInheritanceChain } from './core.ts'

interface DeclaredConstructor {
    name: string
    arity: number
}

export interface ConstructorLayer {
    className: string
    arities: number[]
}

export type ConstructorResolutionResult =
    | { kind: 'matched'; className: string }
    | { kind: 'ambiguous'; className: string }
    | { kind: 'mismatch'; expectedArities: number[] }
    | { kind: 'none' }

export function isConstructorDeclaration(
    functionDeclaration: DeclareFunction,
): boolean {
    return hasConstructorHeaderSignature(functionDeclaration.tokens)
}

export function getFunctionDeclarationArity(
    functionDeclaration: DeclareFunction,
): number {
    if (functionDeclaration.paramNames) {
        return functionDeclaration.paramNames.length
    }

    return extractParamNamesFromHeaderTokens(functionDeclaration.tokens).length
}

export function getDeclaredConstructorsInClass(
    klass: ClassValue,
): DeclaredConstructor[] {
    const constructors: DeclaredConstructor[] = []

    for (const child of klass.body.children) {
        if (!(child instanceof DeclareFunction)) continue
        if (!isConstructorDeclaration(child)) continue

        constructors.push({
            name: child.name,
            arity: getFunctionDeclarationArity(child),
        })
    }

    return constructors
}

export function getDuplicatedConstructorArities(klass: ClassValue): number[] {
    const constructorCountByArity = new Map<number, number>()

    for (const constructor of getDeclaredConstructorsInClass(klass)) {
        constructorCountByArity.set(
            constructor.arity,
            (constructorCountByArity.get(constructor.arity) ?? 0) + 1,
        )
    }

    return [...constructorCountByArity.entries()]
        .filter(([, count]) => count > 1)
        .map(([arity]) => arity)
}

export function createConstructorLayersFromInheritanceChain(
    classValue: ClassValue,
): ConstructorLayer[] {
    return getInheritanceChain(classValue).map((klass) => ({
        className: klass.name,
        arities: getDeclaredConstructorsInClass(klass).map(
            (constructor) => constructor.arity,
        ),
    }))
}

export function resolveConstructorByArity(
    layers: ConstructorLayer[],
    arity: number,
): ConstructorResolutionResult {
    const expectedArities = new Set<number>()

    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i]
        let matchingCount = 0

        for (const layerArity of layer.arities) {
            expectedArities.add(layerArity)
            if (layerArity === arity) {
                matchingCount++
            }
        }

        if (matchingCount > 1) {
            return {
                kind: 'ambiguous',
                className: layer.className,
            }
        }

        if (matchingCount === 1) {
            return {
                kind: 'matched',
                className: layer.className,
            }
        }
    }

    if (expectedArities.size === 0) {
        return {
            kind: 'none',
        }
    }

    return {
        kind: 'mismatch',
        expectedArities: [...expectedArities].sort((a, b) => a - b),
    }
}

function hasConstructorHeaderSignature(allTokens: Token[]): boolean {
    const newlineIndex = allTokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )
    const headerTokens =
        newlineIndex === -1 ? allTokens : allTokens.slice(0, newlineIndex)
    const compactHeaderTokens = headerTokens.filter(
        (token) =>
            token.type !== TOKEN_TYPE.SPACE &&
            token.type !== TOKEN_TYPE.LINE_COMMENT,
    )

    if (compactHeaderTokens.length < 3) return false
    if (compactHeaderTokens[0].type !== TOKEN_TYPE.IDENTIFIER) return false
    if (compactHeaderTokens[0].value !== '약속') return false
    if (compactHeaderTokens[1].type !== TOKEN_TYPE.COMMA) return false
    if (compactHeaderTokens[2].type !== TOKEN_TYPE.IDENTIFIER) return false
    if (compactHeaderTokens[2].value !== '__준비__') return false

    if (compactHeaderTokens.length === 3) return true
    if (compactHeaderTokens[3].type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
        return false
    }

    let parenthesisDepth = 0
    for (let i = 3; i < compactHeaderTokens.length; i++) {
        const token = compactHeaderTokens[i]
        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            parenthesisDepth++
            continue
        }
        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            parenthesisDepth--
            if (parenthesisDepth < 0) return false
            if (parenthesisDepth === 0) {
                return i === compactHeaderTokens.length - 1
            }
        }
    }

    return false
}
