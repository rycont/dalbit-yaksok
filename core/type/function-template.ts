export interface FunctionTemplatePiece {
    type: 'static' | 'value'
    value: string[]
}

export interface FunctionTemplate {
    name: string
    pieces: FunctionTemplatePiece[]
}

export interface YaksokTemplate extends FunctionTemplate {
    type: 'yaksok'
}

export interface FfiTemplate extends FunctionTemplate {
    type: 'ffi'
}
