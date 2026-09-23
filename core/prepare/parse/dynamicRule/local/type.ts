import { ParameterElement } from '../../../../constant/type.ts'

export enum FunctionType {
    약속 = '약속',
    번역 = '번역',
    이벤트 = '이벤트',
}

interface Range {
    start: number
    end: number
}

export type FunctionDeclareRange =
    | {
          type: FunctionType.약속
          line: Range
          signature: Range
      }
    | {
          type: FunctionType.번역
          runtime: string
          line: Range
          signature: Range
      }
    | {
          type: FunctionType.이벤트
          id: string
          line: Range
          signature: Range
      }

export enum FunctionPartType {
    static,
    parameter,
}

export type FunctionStaticPart = {
    type: FunctionPartType.static
    isSuffix: boolean
    names: string[]
}

export type FunctionParameterPart = {
    type: FunctionPartType.parameter
    params: ParameterElement[]
}

export type FunctionHeaderPart = FunctionParameterPart | FunctionStaticPart
