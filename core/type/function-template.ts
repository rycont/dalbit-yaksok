import type { ParameterElement } from '../constant/type.ts'

export enum PIECE_TYPE {
    STATIC = 'static',
    PARAMETER = 'parameter',
    DESTRUCTURE = 'destructure',
}

export enum SIGNATURE_TYPE {
    INTERLEAVING = 'interleaving',
    BRACKET_CALL = 'bracket-call',
    NO_PARAMETER = 'no-parameter',
}

export interface StaticPiece {
    type: PIECE_TYPE.STATIC
    variations: string[]
}

export interface ParameterPiece {
    type: PIECE_TYPE.PARAMETER
    name: string
}

export interface DestructurePiece {
    type: PIECE_TYPE.DESTRUCTURE
    parameterElements: ParameterElement[]
}

export type FunctionTemplatePiece =
    | StaticPiece
    | ParameterPiece
    | DestructurePiece

export interface FunctionTemplate {
    name: string
    pieces: FunctionTemplatePiece[]
    parameterScheme: ParameterElement[]
}

export enum TEMPLATE_TYPE {
    YAKSOK = 'yaksok',
    FFI = 'ffi',
}

export interface YaksokTemplate extends FunctionTemplate {
    type: TEMPLATE_TYPE.YAKSOK
}

export interface FfiTemplate extends FunctionTemplate {
    type: TEMPLATE_TYPE.FFI
}
