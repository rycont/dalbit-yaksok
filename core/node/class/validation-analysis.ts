import { CountLoop } from '../count-loop.ts'
import { IfStatement } from '../IfStatement.ts'
import { ListLoop } from '../listLoop.ts'
import { Loop } from '../loop.ts'
import { Block } from '../block.ts'
import { BooleanLiteral } from '../primitive-literal.ts'
import { Evaluable, Executable, Identifier } from '../base.ts'
import { DeclareFunction } from '../function.ts'
import { ClassValue, getInheritanceChain } from './core.ts'

type ValidationSeedTarget = 'self' | 'super'

interface MemberWriteSeed {
    name: string
    target: ValidationSeedTarget
}

function isSetVariableNode(node: unknown): node is { name: string } {
    return (
        node instanceof Evaluable &&
        'name' in node &&
        typeof (node as { name?: unknown }).name === 'string' &&
        'operator' in node &&
        typeof (node as { operator?: unknown }).operator === 'string' &&
        'value' in node
    )
}

function isSetMemberLikeNode(
    node: unknown,
): node is { target: unknown; memberName: string } {
    return (
        node instanceof Executable &&
        'target' in node &&
        'memberName' in node &&
        typeof (node as { memberName?: unknown }).memberName === 'string' &&
        'value' in node &&
        'operator' in node
    )
}

function toStaticBoolean(condition: Evaluable | undefined): boolean | undefined {
    if (!condition) return undefined
    if (!(condition instanceof BooleanLiteral)) return undefined
    return condition.toPrint() === '참'
}

export function collectGuaranteedMemberWritesFromBlock(
    block: Block,
    options: {
        includePlainSetVariable: boolean
    },
): MemberWriteSeed[] {
    const writes: MemberWriteSeed[] = []

    const collectFromNode = (node: unknown) => {
        if (options.includePlainSetVariable && isSetVariableNode(node)) {
            writes.push({
                name: node.name,
                target: 'self',
            })
            return
        }

        if (isSetMemberLikeNode(node)) {
            const target = node.target
            if (
                target instanceof Identifier &&
                (target.value === '자신' || target.value === '상위')
            ) {
                writes.push({
                    name: node.memberName,
                    target: target.value === '자신' ? 'self' : 'super',
                })
                return
            }
        }

        if (node instanceof IfStatement) {
            for (const caseItem of node.cases) {
                const staticBoolean = toStaticBoolean(caseItem.condition)
                if (staticBoolean === false) {
                    continue
                }

                if (staticBoolean === true) {
                    writes.push(
                        ...collectGuaranteedMemberWritesFromBlock(
                            caseItem.body,
                            options,
                        ),
                    )
                }
                return
            }
            return
        }

        if (node instanceof DeclareFunction) {
            return
        }

        if (
            node instanceof Loop ||
            node instanceof CountLoop ||
            node instanceof ListLoop
        ) {
            return
        }

        if (node instanceof Block) {
            writes.push(...collectGuaranteedMemberWritesFromBlock(node, options))
        }
    }

    for (const child of block.children) {
        collectFromNode(child)
    }

    return writes
}

export function collectLikelyMemberNamesInClass(classValue: ClassValue): Set<string> {
    const names = new Set<string>()

    const collectSetMemberWritesInNode = (node: unknown) => {
        if (isSetMemberLikeNode(node)) {
            const target = node.target
            if (
                target instanceof Identifier &&
                (target.value === '자신' || target.value === '상위')
            ) {
                names.add(node.memberName)
                return
            }
        }

        if (node instanceof Block) {
            for (const child of node.children) {
                collectSetMemberWritesInNode(child)
            }
            return
        }

        if (node instanceof IfStatement) {
            for (const caseItem of node.cases) {
                collectSetMemberWritesInNode(caseItem.body)
            }
            return
        }

        if (
            node instanceof Loop ||
            node instanceof CountLoop ||
            node instanceof ListLoop
        ) {
            collectSetMemberWritesInNode(node.body)
        }
    }

    for (const klass of getInheritanceChain(classValue)) {
        const deterministicWrites = collectGuaranteedMemberWritesFromBlock(
            klass.body,
            {
                includePlainSetVariable: true,
            },
        )
        for (const write of deterministicWrites) {
            names.add(write.name)
        }

        for (const child of klass.body.children) {
            if (!(child instanceof DeclareFunction)) continue
            collectSetMemberWritesInNode(child.body)
        }
    }

    return names
}
