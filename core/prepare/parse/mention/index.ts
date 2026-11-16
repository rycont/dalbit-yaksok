import {
    concatRuleList,
    ErrorInModuleError,
    FileForRunNotExistError,
    RuleList,
    TOKEN_TYPE,
    YaksokSession,
    type Token,
} from '@dalbit-yaksok/core'

import { getMentioningFiles } from './mentioning-files.ts'
import { getExportedRules } from './get-exported-rules.ts'

export function getRulesFromMentioningFile(
    tokens: Token[],
    session: YaksokSession,
): RuleList {
    try {
        const rules = concatRuleList(
            getMentioningFiles(tokens).map(getExportedRules(session)),
        )

        return rules
    } catch (e) {
        if (
            (e instanceof ErrorInModuleError ||
                e instanceof FileForRunNotExistError) &&
            !e.position
        ) {
            const targetFileName = e.resource?.fileName
            if (!targetFileName) throw e

            const firstMentioning = tokens.find(
                (token) =>
                    token.type === TOKEN_TYPE.MENTION &&
                    token.value === '@' + targetFileName,
            )

            if (!firstMentioning) throw e

            e.position = {
                ...firstMentioning.position,
            }
        }

        throw e
    }
}
