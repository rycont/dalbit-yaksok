import {
    FileForRunNotExistError,
    Rule,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { createMentioningRule } from './create-mentioning-rules.ts'

export const getExportedRules =
    (session: YaksokSession) =>
    (fileName: string): Rule[] => {
        const codeFile = session.files[fileName]

        if (!codeFile) {
            throw new FileForRunNotExistError({
                resource: {
                    fileName: fileName,
                    files: Object.keys(session.files),
                },
            })
        }

        const scope = codeFile.ranScope

        if (!scope) {
            throw new Error(
                `한 번 이상 실행 한 파일만 Mention으로 가져올 수 있습니다.`,
            )
        }

        return scope
            .getExportedRules()
            .toArray()
            .map((rule) => createMentioningRule(fileName, rule, scope))
    }
