import type { Node } from '../../node/base.ts'
import type { DynamicRulePattern } from './dynamicRule/index.ts'

/**
 * 재구현 필요
 */
export function splitVariableName(
    nodes: Node[],
    _inheritedIdentifiers: string[] = [],
    _inheritedPatterns: DynamicRulePattern[] = [],
    _depth = 0,
): Node[] {
    return nodes
}
