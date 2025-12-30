import { Scope } from '../executer/scope.ts'
import { Node } from '../node/base.ts'
import { CodeFile } from '../type/code-file.ts'
import { Position } from '../type/position.ts'

export function getAutocomplete(codeFile: CodeFile, position: Position): string[] {
    const scopes = codeFile.validationScopes

    let narrowestScope: Scope | null = null
    let narrowestScopeSize = Infinity

    for (const [node, scope] of scopes) {
        if (isCursorInNode(node, position)) {
            const scopeSize = node.tokens.length
            
            if (scopeSize < narrowestScopeSize) {
                narrowestScopeSize = scopeSize
                narrowestScope = scope
            }
        }
    }

    if (!narrowestScope) {
        return []
    }

    const localIdentifiers = getAvailableIdentifiers(narrowestScope)
    const mentionedModuleIdentifiers = getMentionedModuleIdentifiers(codeFile)

    return [...localIdentifiers, ...mentionedModuleIdentifiers]
}

function isCursorInNode(node: Node, position: Position): boolean {
    const startingToken = node.tokens[0].position
    const endingToken = node.tokens[node.tokens.length - 1].position

    const isAfterStartingToken =
        startingToken.line < position.line ||
        (startingToken.line === position.line &&
            startingToken.column <= position.column)

    if (!isAfterStartingToken) {
        return false
    }

    const isBeforeEndingToken =
        position.line < endingToken.line ||
        (position.line === endingToken.line &&
            position.column <= endingToken.column)

    return isBeforeEndingToken
}

function getAvailableIdentifiers(scope: Scope | undefined): string[] {
    if (!scope) {
        return []
    }

    return [
        ...Object.keys(scope.variables),
        ...scope.functions.keys().toArray(),
        ...getAvailableIdentifiers(scope.parent),
    ]
}

function getMentionedModuleIdentifiers(codeFile: CodeFile): string[] {
    const session = codeFile.session
    if (!session) {
        return []
    }

    const results: string[] = []
    
    for (const [moduleName, moduleCodeFile] of Object.entries(session.files)) {
        // 현재 파일은 제외
        if (moduleCodeFile === codeFile) {
            continue
        }
        
        // baseContext 심볼은 제외 (이미 로컬 스코프에 포함됨)
        if (typeof moduleName === 'symbol') {
            continue
        }

        try {
            const { validatingScope } = moduleCodeFile.validate()
            const moduleIdentifiers = getIdentifiersFromScope(validatingScope)
            
            for (const identifier of moduleIdentifiers) {
                results.push(`@${moduleName} ${identifier}`)
            }
        } catch {
            // 모듈 유효성 검사 실패 시 무시
        }
    }

    return results
}

function getIdentifiersFromScope(scope: Scope | undefined): string[] {
    if (!scope) {
        return []
    }

    return [
        ...Object.keys(scope.variables),
        ...scope.functions.keys().toArray(),
        ...getIdentifiersFromScope(scope.parent),
    ]
}
