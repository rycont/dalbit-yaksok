import { StateEffect, StateField } from '@codemirror/state'
import { CodeFile } from '@dalbit-yaksok/core'

export const codeParseDone = StateEffect.define<CodeFile>()
export const parsedCodeStore = StateField.define<CodeFile | null>({
    create() {
        return null
    },
    update(v, tr) {
        const updated = tr.effects.find((e) => e.is(codeParseDone))?.value
        return updated || v
    },
})

export const validationDone =
    StateEffect.define<ReturnType<CodeFile['validate']>>()
export const validationResultStore = StateField.define<ReturnType<
    CodeFile['validate']
> | null>({
    create() {
        return null
    },
    update(v, tr) {
        const updated = tr.effects.find((e) => e.is(validationDone))?.value
        return updated || v
    },
})
