import * as v from 'valibot'

import type { Node, NodeType, Rule } from '@dalbit-yaksok/core'
import { match, P } from 'ts-pattern'

interface RuleWithPriority {
    priority: number
    rule: Rule
}

export class TrieNode {
    constructor(
        private nodeKey: NodeType,
        private rules: RuleWithPriority[],
        private children: TrieNode[] | null,
    ) {}

    private nodeTrieCache = new WeakMap<NodeType, TrieNode[]>()

    public discover(nodes: Node[], depth = 1): RuleWithPriority[] {
        if (nodes.length < depth) {
            return []
        }

        const currentDepthNode = nodes[nodes.length - depth]

        if (!(currentDepthNode instanceof this.nodeKey)) {
            return []
        }

        const nextDepthNode = nodes[nodes.length - depth - 1]

        const subrules = nextDepthNode
            ? this.getChildrenTrieByNode(nextDepthNode)
                  .flatMap((t) => t.discover(nodes, depth + 1))
                  .filter((r) => !!r)
            : []

        const rules = this.rules.concat(subrules)

        const validRules = rules.filter((r) => {
            const patternUnit = r.rule.pattern[r.rule.pattern.length - depth]

            const matchResult = match(patternUnit)
                .with(P.instanceOf(Function), () => true)
                .with(
                    {
                        type: P.instanceOf(Function),
                        value: currentDepthNode.value,
                    },
                    () => true,
                )
                .with(
                    {
                        type: P.instanceOf(Function),
                        value: P.nonNullable,
                    },
                    () => false,
                )
                .with(
                    {
                        type: P.instanceOf(Function),
                    },
                    () => true,
                )
                .with(
                    {
                        kind: 'schema',
                    },
                    (r) => {
                        return v.safeParse(r, currentDepthNode).success
                    },
                )
                .otherwise(() => false)

            // console.log(currentDepthNode, patternUnit, matchResult)

            return matchResult
        })

        return validRules
    }

    private getChildrenTrieByNode(node: Node): TrieNode[] {
        if (!this.children) {
            return []
        }

        const nodeClass = node.constructor as NodeType

        const cached = this.nodeTrieCache.get(nodeClass)

        if (cached) {
            return cached
        }

        const subTries = this.children.filter(
            ({ nodeKey }) => node instanceof nodeKey,
        )

        this.nodeTrieCache.set(nodeClass, subTries)

        return subTries
    }
}

export class Ruleset {
    private trieNodes: TrieNode[]

    constructor(rules: Rule[]) {
        const ruleWithPriority: RuleWithPriority[] = rules.map(
            (rule, index) => ({
                priority: index,
                rule,
            }),
        )

        const tries = rulesToTries(ruleWithPriority)
        this.trieNodes = tries
    }

    static instanceCache = new WeakMap<Rule[], Ruleset>()

    static createFromRules(rules: Rule[]) {
        return Ruleset.instanceCache.getOrInsertComputed(
            rules,
            (fetchingRules) => new Ruleset(fetchingRules),
        )
    }

    public findRule(nodes: Node[]): Rule[] {
        const rules = this.trieNodes
            .flatMap((t) => t.discover(nodes))
            .toSorted((a, b) => a.priority - b.priority)
            .map((r) => r.rule)

        return rules
    }
}

function rulesToTries(rules: RuleWithPriority[], depth = 1): TrieNode[] {
    const ruleBucketsByNodeClass = new Map<NodeType, RuleWithPriority[]>()

    for (const r of rules) {
        if (r.rule.pattern.length < depth) {
            continue
        }

        const topNodePatternUnit = r.rule.pattern[r.rule.pattern.length - depth]

        const topNodeClass = match(topNodePatternUnit)
            .with(P.instanceOf(Function), (f) => f)
            .with(
                {
                    type: P.instanceOf(Function).select(),
                },
                (f) => f,
            )
            .with(
                {
                    type: 'instance',
                    class: P.select(),
                },
                (f) => f,
            )
            .with(
                {
                    type: 'intersect',
                    options: P.select(),
                },
                (options) =>
                    (
                        (options as v.IntersectOptions).find(
                            (o) => o.type === 'instance',
                        ) as v.InstanceSchema<NodeType, undefined> | null
                    )?.class,
            )
            .otherwise(() => null) as NodeType

        if (!topNodeClass) {
            throw new Error('Cannot process pattern unit of above kind')
        }

        const bucketContent = ruleBucketsByNodeClass.get(topNodeClass)

        if (bucketContent) {
            bucketContent.push(r)
        } else {
            ruleBucketsByNodeClass.set(topNodeClass, [r])
        }
    }

    const tries = ruleBucketsByNodeClass
        .entries()
        .map(([nodeClass, rules]) => {
            const { completed, hasMore } = Object.groupBy(rules, (r) =>
                r.rule.pattern.length === depth ? 'completed' : 'hasMore',
            )

            return new TrieNode(
                nodeClass,
                completed ?? [],
                hasMore ? rulesToTries(hasMore, depth + 1) : null,
            )
        })
        .toArray()

    return tries
}
