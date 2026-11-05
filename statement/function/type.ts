import { Token } from '@dalbit-yaksok/core'

export enum FunctionType {
    약속 = '약속',
    번역 = '번역',
    이벤트 = '이벤트',
}

export enum FunctionPartType {
    static,
    parameter,
}

export type FunctionStaticPart = {
    type: FunctionPartType.static
    isSuffix: boolean
    names: Token[]
}

export type FunctionParameterPart = {
    type: FunctionPartType.parameter
    params: ParameterElement[]
}

export type FunctionHeaderPart = FunctionParameterPart | FunctionStaticPart

export interface ParameterElement {
    name: string
    optional: boolean
    tokens: Token[]
}

export interface FunctionSignature {
    functionName: string
    parameterScheme: ParameterElement[]
    headerParts: FunctionHeaderPart[]
}
