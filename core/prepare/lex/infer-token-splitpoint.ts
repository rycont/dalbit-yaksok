import { Brand, NotDefinedIdentifierError } from '@dalbit-yaksok/core'

export type Splitpoint = Brand<number, 'SplitPoint'>

export function inferTokenSplitPointFromErrors(
    _missingIdentifierErrors: NotDefinedIdentifierError[],
): Splitpoint[] {
    return []
}
