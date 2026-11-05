// import {
//     Block,
//     Executable,
//     FunctionDeclareHeader,
//     InvokingArguments,
//     MissingFunctionBody,
//     renderErrorString,
//     Scope,
//     Token,
//     ValueType,
//     YaksokError,
//     FunctionType,
// } from '@dalbit-yaksok/core'
//
// export class DeclareEvent extends Executable {
//     static override friendlyName = '새 이벤트 만들기'
//
//     constructor(
//         public readonly header: FunctionDeclareHeader<FunctionType.이벤트>,
//         public override tokens: Token[],
//     ) {
//         super()
//     }
//
//     override execute(scope: Scope): Promise<void> {
//         scope.events.set(this.header.range.id, this)
//
//         return Promise.resolve()
//     }
//
//     override validate(scope: Scope): YaksokError[] {
//         return this.header
//             .validate(scope)
//             .filter((e) => !(e instanceof MissingFunctionBody))
//     }
// }
//
