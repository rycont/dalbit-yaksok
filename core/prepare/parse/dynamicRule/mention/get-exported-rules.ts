import { YaksokError } from '../../../../error/common.ts'
import { ErrorInModuleError } from '../../../../error/mention.ts'
import { FileForRunNotExistError } from '../../../../error/prepare.ts'
import type { YaksokSession } from '../../../../runtime/index.ts'
import { createMentioningRule } from './create-mentioning-rules.ts'
import type { Rule } from '../../rule.ts' // Rule 타입 import

export function getExportedRules(runtime: YaksokSession, fileName: string) {
    const runner = runtime.getCodeFile(fileName)
    try {
        const rules = runner.exportedRules

        const mentioningRules = rules
            .filter((rule: Rule) => rule.config?.exported) // rule 타입 명시
            .map((rule: Rule) => createMentioningRule(fileName, rule)) // rule 타입 명시

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
