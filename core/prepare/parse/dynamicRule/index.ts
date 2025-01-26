import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'

export function createDynamicRule(codeFile: CodeFile) {
    const localRules = createLocalDynamicRules(
        codeFile.tokens,
        codeFile.functionDeclareRanges,
    )

    const mentioningRules = getRulesFromMentioningFile(codeFile)

    return [...localRules, mentioningRules]
}
