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

    const functionNames = [...scope.functions.keys()].flatMap(expandFunctionNameBranches)

    return [
        ...Object.keys(scope.variables),
        ...functionNames,
        ...getAvailableIdentifiers(scope.parent),
    ]
}

/**
 * 함수 이름에 분기(`/`)가 있으면 각 분기를 분리하여 여러 이름으로 확장합니다.
 * 예: "(대상)이여/여 지금" → ["(대상)이여 지금", "(대상)여 지금"]
 */
function expandFunctionNameBranches(functionName: string): string[] {
    const parts = parseFunctionNameParts(functionName)
    const hasBranching = parts.some(part => part.type === 'branching')
    
    if (!hasBranching) {
        return [functionName]
    }

    return generateAllCombinations(parts)
}

interface FunctionNamePart {
    type: 'static' | 'branching'
    value: string | string[]
}

/**
 * 함수 이름을 파싱하여 정적 부분과 분기 부분으로 분리합니다.
 */
function parseFunctionNameParts(functionName: string): FunctionNamePart[] {
    const parts: FunctionNamePart[] = []
    let currentStaticPart = ''
    let i = 0

    while (i < functionName.length) {
        const char = functionName[i]

        // 괄호 안의 내용은 그대로 유지 (파라미터)
        if (char === '(') {
            const closeIndex = functionName.indexOf(')', i)
            if (closeIndex !== -1) {
                currentStaticPart += functionName.slice(i, closeIndex + 1)
                i = closeIndex + 1
                continue
            }
        }

        // `/`를 만나면 분기 처리 시작
        if (char === '/') {
            // 현재까지의 정적 부분에서 분기 시작점 찾기
            const branchStart = findBranchStartIndex(currentStaticPart)
            
            if (branchStart > 0) {
                parts.push({
                    type: 'static',
                    value: currentStaticPart.slice(0, branchStart)
                })
            }

            const firstBranch = currentStaticPart.slice(branchStart)
            const branches = [firstBranch]
            
            // `/` 이후의 분기들 수집
            i++ // `/` 건너뛰기
            let nextBranch = ''
            
            while (i < functionName.length) {
                const nextChar = functionName[i]
                
                if (nextChar === '/') {
                    branches.push(nextBranch)
                    nextBranch = ''
                    i++
                    continue
                }
                
                // 공백이나 괄호를 만나면 분기 종료
                if (nextChar === ' ' || nextChar === '(') {
                    break
                }
                
                nextBranch += nextChar
                i++
            }
            
            if (nextBranch) {
                branches.push(nextBranch)
            }

            parts.push({
                type: 'branching',
                value: branches
            })
            
            currentStaticPart = ''
            continue
        }

        currentStaticPart += char
        i++
    }

    if (currentStaticPart) {
        parts.push({
            type: 'static',
            value: currentStaticPart
        })
    }

    return parts
}

/**
 * 분기가 시작되는 인덱스를 찾습니다.
 * 괄호 닫힘 이후의 위치를 우선적으로 찾고, 없으면 공백 다음 위치를 반환합니다.
 */
function findBranchStartIndex(text: string): number {
    // 괄호 닫힘 이후의 위치를 먼저 확인 (조사가 붙는 위치)
    const lastParenIndex = text.lastIndexOf(')')
    const lastSpaceIndex = text.lastIndexOf(' ')
    
    // 둘 다 있으면 더 뒤에 있는 것을 선택
    if (lastParenIndex !== -1 && lastSpaceIndex !== -1) {
        // 공백이 괄호보다 뒤에 있으면 공백 다음 위치 반환
        if (lastSpaceIndex > lastParenIndex) {
            return lastSpaceIndex + 1
        }
        // 괄호가 공백보다 뒤에 있으면 괄호 다음 위치 반환
        return lastParenIndex + 1
    }
    
    // 괄호만 있으면 괄호 다음 위치 반환
    if (lastParenIndex !== -1) {
        return lastParenIndex + 1
    }
    
    // 공백만 있으면 공백 다음 위치 반환
    if (lastSpaceIndex !== -1) {
        return lastSpaceIndex + 1
    }
    
    return 0
}

/**
 * 파싱된 부분들로부터 모든 조합을 생성합니다.
 */
function generateAllCombinations(parts: FunctionNamePart[]): string[] {
    let combinations: string[] = ['']

    for (const part of parts) {
        if (part.type === 'static') {
            combinations = combinations.map(combo => combo + part.value)
        } else {
            const branches = part.value as string[]
            const newCombinations: string[] = []
            
            for (const combo of combinations) {
                for (const branch of branches) {
                    newCombinations.push(combo + branch)
                }
            }
            
            combinations = newCombinations
        }
    }

    return combinations
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

    const functionNames = [...scope.functions.keys()].flatMap(expandFunctionNameBranches)

    return [
        ...Object.keys(scope.variables),
        ...functionNames,
        ...getIdentifiersFromScope(scope.parent),
    ]
}
