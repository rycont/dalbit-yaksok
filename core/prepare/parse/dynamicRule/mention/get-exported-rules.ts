import { YaksokError } from '../../../../error/common.ts'
import { ErrorInModuleError } from '../../../../error/mention.ts'
import { FileForRunNotExistError } from '../../../../error/prepare.ts'
import type { YaksokSession } from '../../../../session/session.ts'
import type { Rule } from '../../rule/index.ts'
import { createMentioningRule } from './create-mentioning-rules.ts'

export function getExportedRules(session: YaksokSession, fileName: string) {
    const codeFile = session.getCodeFile(fileName)
    try {
        const rules =
            codeFile.appliedRules?.filter((r) => r.config?.exported) || []

        const mentioningRules = rules.map((rule: Rule) =>
            createMentioningRule(fileName, rule),
        )

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
