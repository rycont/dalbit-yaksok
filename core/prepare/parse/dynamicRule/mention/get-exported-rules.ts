import { YaksokError } from '../../../../error/common.ts'
import { ErrorInModuleError } from '../../../../error/mention.ts'
import { FileForRunNotExistError } from '../../../../error/prepare.ts'
import type { YaksokSession } from '../../../../session/session.ts'
import type { Rule } from '../../rule.ts'
import { createMentioningRule } from './create-mentioning-rules.ts'

export function getExportedRules(session: YaksokSession, fileName: string) {
    const codeFile = session.getCodeFile(fileName)
    try {
        const rules = codeFile.exportedRules

        const mentioningRules = rules
            .filter((rule: Rule) => rule.config?.exported)
            .map((rule: Rule) => createMentioningRule(fileName, rule))

        return mentioningRules
    } catch (e) {
        if (
            e instanceof YaksokError &&
            !(e instanceof FileForRunNotExistError)
        ) {
            throw new ErrorInModuleError({
                resource: {
                    fileName,
                },
                child: e,
            })
        }

        throw e
    }
}
