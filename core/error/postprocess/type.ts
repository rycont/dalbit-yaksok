import { Token, YaksokError } from '@dalbit-yaksok/core'

export type Processor = (
    errors: YaksokError[],
    tokens: Token[],
) => YaksokError[]
