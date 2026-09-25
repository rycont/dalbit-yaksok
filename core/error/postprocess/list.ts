import { match } from 'ts-pattern'
import { Processor } from './type.ts'
import {
    BrokenBracketError,
    Expression,
    NotExecutableNodeError,
    Sequence,
} from '@dalbit-yaksok/core'
import { blue, bold } from '../../util/terminal.ts'

export const prettifyBrokenList: Processor = (errors) => {
    const openingBracketErrorIndexes = errors.flatMap((error, index) =>
        error instanceof NotExecutableNodeError &&
        error.node instanceof Expression &&
        error.node.value === '['
            ? [index]
            : [],
    )

    if (openingBracketErrorIndexes.length === 0) {
        return errors
    }

    const brokenOpeningBracketErrorIndexes = openingBracketErrorIndexes.filter(
        (errorIndex) => {
            const nextError = errors[errorIndex + 1]

            return (
                nextError instanceof NotExecutableNodeError &&
                nextError.node instanceof Sequence
            )
        },
    )

    if (brokenOpeningBracketErrorIndexes.length === 0) {
        return errors
    }

    const newErrors = errors
        .map((error, index) => {
            if (brokenOpeningBracketErrorIndexes.includes(index)) {
                return new BrokenBracketError({
                    node: error.node!,
                    resource: {
                        message: `목록을 닫는 괄호가 필요해요. 목록의 내용이 끝나면 ${blue(bold(']'))}를 사용해서 닫아주세요.`,
                    },
                    scope: error.scope!,
                })
            }

            if (brokenOpeningBracketErrorIndexes.includes(index - 1)) {
                return null
            }
        })
        .filter<BrokenBracketError>((error) => !!error)

    return newErrors
}
