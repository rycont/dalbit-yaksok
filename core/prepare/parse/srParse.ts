import { ADVANCED_RULES, BASIC_RULES } from './rule/index.ts'

import { Block } from '../../node/block.ts'

import { Identifier, type Node } from '../../node/base.ts'
import { Formula } from '../../node/calculation.ts'
import { EOL } from '../../node/misc.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'
import { Rule } from './type.ts'
import { FunctionCallOperatorAmbiguityError } from '../../error/prepare.ts'
import { RESERVED_WORDS } from '../../constant/reserved-words.ts'
import { Ruleset } from './ruleset.ts'
import { NotAcceptableSignal } from './signal.ts'

export function SRParse(_nodes: Node[], ruleset: Ruleset) {
    const leftNodes = [..._nodes]
    const buffer: Node[] = []

    let changed = false

    nodeloop: while (true) {
        const matchedRules = ruleset.findRule(buffer)

        for (const rule of matchedRules) {
            const isStatement = !!rule.config?.statement

            if (isStatement) {
                const nextNode = leftNodes[0]
                if (nextNode && !(nextNode instanceof EOL)) continue

                const lastNode = buffer[buffer.length - rule.pattern.length - 1]
                if (lastNode && !(lastNode instanceof EOL)) continue
            }

            const stackSlice = buffer.slice(-rule.pattern.length)
            const reduced = reduce(stackSlice, rule)

            if (reduced === null) continue

            if (
                stackSlice.length === 1 &&
                reduced.constructor === stackSlice[0].constructor
            ) {
                continue
            }

            // 패턴 1: `Identifier(receiver) Identifier(funcArg) op X`에서
            // BASIC_RULES가 `funcArg op X` → Formula를 먼저 reduce할 때
            // receiver Identifier가 고아로 남는 경우를 감지
            //
            // 단, 앞에 있는 Identifier가 예약어(`만약`, `반복` 등)인 경우는
            // 함수 인자가 아니라 키워드이므로 제외한다.
            const prevNode = buffer[buffer.length - rule.pattern.length - 1]
            if (
                reduced instanceof Formula &&
                stackSlice[0] instanceof Identifier &&
                prevNode instanceof Identifier &&
                !RESERVED_WORDS.has((prevNode as Identifier).value)
            ) {
                // 함수 이름이 여러 단어로 이루어진 경우(예: `현재 밀리초 가져오기`)
                // prevNode 앞에 연속된 Identifier들도 함께 포함한다.
                const startIdx = buffer.length - rule.pattern.length - 1
                let funcStart = startIdx
                while (
                    funcStart > 0 &&
                    buffer[funcStart - 1] instanceof Identifier &&
                    !RESERVED_WORDS.has(
                        (buffer[funcStart - 1] as Identifier).value,
                    )
                ) {
                    funcStart--
                }
                const funcNodes = buffer.slice(funcStart, startIdx + 1)
                throw new FunctionCallOperatorAmbiguityError({
                    tokens: getTokensFromNodes([...funcNodes, ...stackSlice]),
                })
            }

            buffer.splice(-rule.pattern.length, rule.pattern.length, reduced)

            changed = true
            continue nodeloop
        }

        if (leftNodes.length === 0) break
        buffer.push(leftNodes.shift()!)
    }

    return {
        changed,
        nodes: buffer,
    }
}

export function reduce(nodes: Node[], rule: Rule) {
    const tokens = getTokensFromNodes(nodes)

    try {
        const reduced = rule.factory(nodes, tokens)
        if (reduced === null) {
            return null
        }

        return reduced
    } catch (e) {
        if (e instanceof NotAcceptableSignal) {
            return null
        }

        throw e
    }
}

export function callParseRecursively(
    _tokens: Node[],
    externalPatterns: [Rule[][], Rule[][]],
): Node[] {
    let parsedTokens = [..._tokens]

    for (let i = 0; i < parsedTokens.length; i++) {
        const token = parsedTokens[i]

        if (token instanceof Block) {
            token.subnode = callParseRecursively(
                token.subnode,
                externalPatterns,
            )
        }
    }

    const rulesByLevel = [
        ...externalPatterns[0],
        BASIC_RULES[0],
        ...BASIC_RULES.slice(1),
        ...externalPatterns[1],
        ADVANCED_RULES,
    ]

    const rulesets = rulesByLevel.map((rules) => Ruleset.createFromRules(rules))

    loop1: while (true) {
        for (const ruleset of rulesets) {
            const result = SRParse(parsedTokens, ruleset)
            parsedTokens = result.nodes

            if (result.changed) continue loop1
        }

        break
    }

    return parsedTokens
}
