import { StateField } from '@codemirror/state'
import { CodeFile, YaksokSession } from '@dalbit-yaksok/core'

export const codeFileStore = StateField.define<CodeFile | null>({
    create() {
        return null
    },
    update(v, tr) {
        const session = new YaksokSession()
        const codeFile = session.addModule('main', tr.newDoc.toString())

        return codeFile
    },
})
