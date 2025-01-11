import { Position, Token } from '@dalbit-yaksok/core'

export interface ColorToken extends Token {
    position: Position
    scope?: string
}

export interface ColorPart {
    position: Position
    scopes: string
}
