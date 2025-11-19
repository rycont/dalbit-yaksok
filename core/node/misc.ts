import { YaksokError } from '../error/common.ts'
import { Executable, Node, Evaluable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { StringValue } from '../value/primitive.ts'
import { ValueType } from '../value/base.ts'

export class EOL extends Node {
    static override friendlyName = '줄바꿈'

    constructor(public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Indent extends Node {
    static override friendlyName = '들여쓰기'

    constructor(public size: number, public override tokens: Token[]) {
        super()
    }

    override validate(): YaksokError[] {
        return []
    }
}

export class Print extends Executable {
    static override friendlyName = '보여주기'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const printFunction = scope.codeFile?.session?.stdout ?? console.log
        const evaluated = await this.value.execute(scope)

        printFunction(evaluated.toPrint())
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}

// export class Input extends Evaluable<StringValue> {
//     static override friendlyName = '입력받기'

//     constructor(
//         public question: Evaluable | null,
//         public override tokens: Token[],
//     ) {
//         super()
//     }

//     override async execute(scope: Scope): Promise<StringValue> {
//         const inputFunction =
//             scope.codeFile?.session?.stdin ?? (async () => '')

//         let questionText: string | undefined

//         if (this.question) {
//             const evaluatedQuestion = await this.question.execute(scope)
//             questionText = evaluatedQuestion.toPrint()
//         }

//         try {
//             const result = await Promise.resolve(inputFunction(questionText))
            
//             if (result == null) {
//                 return new StringValue('')
//             }

//             return new StringValue(String(result))
//         } catch (error) {
//             // stdin 함수에서 발생한 에러를 그대로 전파
//             throw error
//         }
//     }

//     override validate(scope: Scope): YaksokError[] {
//         if (!this.question) {
//             return []
//         }

//         return this.question.validate(scope)
//     }
// }

export class TypeOf extends Evaluable {
    static override friendlyName = '값 종류'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<StringValue> {
        const evaluated = await this.value.execute(scope)

        return new StringValue((evaluated.constructor as typeof ValueType).friendlyName)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}

export class Pause extends Executable {
    static override friendlyName = '잠깐 멈추기'

    constructor(public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        scope.codeFile?.session?.pubsub.pub('debug', [scope, this])
        scope.codeFile?.session?.pause()
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
}
