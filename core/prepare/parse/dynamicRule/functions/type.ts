export enum FunctionType {
    약속,
    번역,
    이벤트,
}

export type FunctionDeclareRange =
    | {
          type: FunctionType.약속
          start: number
          end: number
      }
    | {
          type: FunctionType.번역
          runtime: string
          start: number
          end: number
      }
    | {
          type: FunctionType.이벤트
          id: string
          start: number
          end: number
      }
