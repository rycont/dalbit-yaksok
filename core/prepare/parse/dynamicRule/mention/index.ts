import { getExportedRules } from './get-exported-rules.ts'
import { getMentioningFiles } from './mentioning-files.ts'

import { ErrorInModuleError } from '../../../../error/mention.ts'
import { FileForRunNotExistError } from '../../../../error/prepare.ts'
import { TOKEN_TYPE } from '../../../tokenize/token.ts'

import type { CodeFile } from '../../../../type/code-file.ts'
import type { Rule } from '../../type.ts'

export function getRulesFromMentioningFile(codeFile: CodeFile): Rule[] {
    if (!codeFile.mounted) {
        console.warn(
            'CodeFile is not mounted to Session, skips mentioning files',
        )

        return []
    }

    try {
        const rules = getMentioningFiles(codeFile.tokens).flatMap((fileName) =>
            getExportedRules(codeFile.session!, fileName),
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

            const firstMentioning = codeFile.tokens.find(
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
