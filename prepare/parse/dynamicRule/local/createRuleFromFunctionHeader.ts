import { type Node, Identifier, Expression } from '../../../../node/index.ts'
import { isParentheses } from '../../../../util/isBracket.ts'
import { createFunctionDeclareRule } from './declareRule.ts'
import type {
    functionRuleByType,
    FunctionHeaderNode,
} from './functionRuleByType.ts'
import { getVariants } from './getVariants.ts'
import { createFunctionInvokeRule } from './invokeRule.ts'

export function createRuleFromFunctionHeader(
    subtokens: Node[],
    type: keyof typeof functionRuleByType,
) {
    assertValidFunctionHeader(subtokens)

    const name = getFunctionNameFromHeader(subtokens)
    const variants = [...getVariants(subtokens)]

    const declareRule = createFunctionDeclareRule(name, subtokens, {
        type,
    })
    const invokeRules = variants.map((v) => createFunctionInvokeRule(name, v))

    return [declareRule, ...invokeRules]
}

function assertValidFunctionHeader(
    subtokens: Node[],
): asserts subtokens is FunctionHeaderNode[] {
    for (const token of subtokens) {
        if (token instanceof Identifier) continue
        if (isParentheses(token)) continue
    }
}

function getFunctionNameFromHeader(subtokens: FunctionHeaderNode[]) {
    return subtokens.map(functionHeaderToNameMap).filter(Boolean).join(' ')
}

function functionHeaderToNameMap(token: FunctionHeaderNode) {
    if (token instanceof Identifier) {
        return token.value
    }

    if (token instanceof Expression) {
        return null
    }
}
