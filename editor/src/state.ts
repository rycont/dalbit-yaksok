import { StateField } from '@codemirror/state'
import { CodeFile, YaksokSession } from '@dalbit-yaksok/core'

export const validationResultStore = StateField.define<ReturnType<
    CodeFile['validate']
> | null>({
    create() {
        return null
    },
    update(v, tr) {
      const session = new YaksokSession()

      const codeFile = session.addModule('main', tr.newDoc.toString())
      const validationResult = codeFile.validate()

      return validationResult
    },
})
