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

        return codeFile.mentionRules || []
    }
