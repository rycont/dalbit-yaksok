import {
    FileForRunNotExistError,
    Rule,
    YaksokSession,
} from '@dalbit-yaksok/core'

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

        const { mentionRules } = codeFile

        if (mentionRules === null) {
            throw new Error(
                `이미 실행된 모듈만 Mention할 수 있습니다. ${fileName}은 존재하지만 아직 실행된 적이 없습니다.`,
            )
        }

        return mentionRules
    }
