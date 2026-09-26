import {
    IndentIsNotMultipleOf4Error,
    IndentLevelMismatchError,
} from '@dalbit-yaksok/core'
import { Processor } from './type.ts'

export const prettifyIndentError: Processor = (errors) => {
    const indentErrors = errors.filter(
        (e) =>
            e instanceof IndentIsNotMultipleOf4Error ||
            e instanceof IndentLevelMismatchError,
    )

    if (indentErrors.length === 0) {
        return errors
    }

    return indentErrors
}
