import {
    ErrorInModuleError,
    FileForRunNotExistError,
    Rule,
    Token,
    TOKEN_TYPE,
    YaksokSession,
} from '@dalbit-yaksok/core'

import { getMentioningFiles } from './mentioning-files.ts'
import { getExportedRules } from './get-exported-rules.ts'

export function getRulesFromMentioningFile(
    tokens: Token[],
    session: YaksokSession,
): Rule[] {
    try {
        const rules = getMentioningFiles(tokens).flatMap(
            getExportedRules(session),
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
