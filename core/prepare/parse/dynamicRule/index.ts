import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'
import type { Rule } from '../type.ts'

export function createDynamicRule(codeFile: CodeFile): [Rule[][], Rule[][]] {
    const localRules = createLocalDynamicRules(
        codeFile.tokens,
        codeFile.functionDeclareRanges,
    )

    const mentioningRules = getRulesFromMentioningFile(codeFile)
    const baseContextRules = codeFile.session?.baseContext?.exportedRules || []

    const extensionRules =
        codeFile.session?.extensions.flatMap(
            (extension) => extension.manifest.parsingRules || [],
        ) || []

    return [
        [extensionRules, ...localRules[0]],
        [...localRules[1], mentioningRules, baseContextRules],
    ]
}
