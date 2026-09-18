import { YaksokError } from '../error/common.ts'
import { LoopCountIsNotNumberError } from '../error/loop.ts'
import { Scope } from '../executer/scope.ts'
import { BreakSignal, ContinueSignal } from '../executer/signals.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { NumberValue } from '../value/primitive.ts'
import { Evaluable, Executable, NodeCapability } from './base.ts'
import { Block } from './block.ts'

export class CountLoop extends Executable<{
    count: Evaluable
    body: Block
}> {
    static override friendlyName = '횟수 반복'
    static override accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        count: Evaluable,
        body: Block,
        public override tokens: Token[],
    ) {
        super()

        this.subnode = {
            count,
            body,
        }
    }

    override async execute(parent: Scope): Promise<void> {
        const scope = new Scope({
            parent: parent,
        })

        const countValue = await this.subnode.count.execute(scope)

        if (!(countValue instanceof NumberValue)) {
            throw new LoopCountIsNotNumberError({
                tokens: this.subnode.count.tokens,
                value: countValue,
            })
        }

        const countNumber = countValue.value

        try {
            for (let i = 0; i < countNumber; i++) {
                await this.onRunChild({
                    scope,
                    childTokens: this.subnode.body.tokens,
                    skipReport: true,
                })
                try {
                    await this.subnode.body.execute(scope)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        return this.subnode.body.validate(scope)
    }
}
