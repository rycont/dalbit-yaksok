import type { Node } from '../../../../node/base.ts'
import type { FunctionTemplate } from '../../../../type/function-template.ts'
import type { PatternUnit } from '../../type.ts'

export interface FunctionDeclareRulePreset {
    prefix: PatternUnit[]
    postfix: PatternUnit[]
    createFactory: (
        template: FunctionTemplate,
    ) => (matchedNodes: Node[]) => Node
}
