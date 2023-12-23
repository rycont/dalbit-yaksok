import { parse } from './prepare/parse/index.ts'
import { run } from './runtime/run.ts'
import { Node } from './node/index.ts'
import { Scope } from './runtime/scope.ts'
import { tokenize } from './prepare/tokenize/index.ts'
import { YaksokError } from './error/common.ts'
import { printError } from './printError.ts'

export class Yaksok {
    functionDeclaration: Node[][] = []
    scope: Scope

    constructor() {
        this.scope = new Scope()
    }

    run(code: string) {
        const tokens = tokenize(code)
        const ast = parse(tokens)

        try {
            return run(ast, this.scope, code)
        } catch (error) {
            if (error instanceof YaksokError) {
                printError(error, code)
            }

            throw error
        }
    }
}

export function yaksok(code: string) {
    const runtime = new Yaksok()
    return runtime.run(code)
}
