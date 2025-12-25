import { Scope } from '../executer/scope.ts'
import { Node } from '../node/base.ts'
import { CodeFile } from '../type/code-file.ts'
import { Position } from '../type/position.ts'

export function getAutocomplete(codeFile: CodeFile, position: Position) {
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

    return getAvailableIdentifiers(narrowestScope)
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
