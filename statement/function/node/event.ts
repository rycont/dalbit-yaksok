import {
    Block,
    Token,
    YaksokError,
    Scope,
    Statement,
    RunFrame,
    ReferenceSlot,
    SlotKey,
    isRunnable,
    Runnable,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'
import { FunctionObject } from '../value/function'

export class SubscribeEvent implements Statement {
    static friendlyName = '이벤트 구독하기'
    public parsingErrors: YaksokError[] = []

    public [ReferenceSlot]: SlotKey

    constructor(
        public scope: Scope,
        referenceSlot: SlotKey,
        private callbackSlotKey: SlotKey,
        private readonly body: Block,
        private invokingArguments: InvokingArguments,
        public readonly tokens: Token[],
    ) {
        this[ReferenceSlot] = referenceSlot
    }

    async execute(runFrame: RunFrame): Promise<void> {
        const args = await this.invokingArguments.execute(runFrame)

        const event = runFrame.get(this[ReferenceSlot])

        if (!isRunnable(event)) {
            throw ''
        }

        const argsWithBodySymbol = new Map(args)
        argsWithBodySymbol.set(
            this.callbackSlotKey,
            new FunctionObject(null, this.body, runFrame),
        )

        void event[Runnable].run(argsWithBodySymbol)
    }

    validate(): YaksokError[] {
        const subnodeErrors = this.invokingArguments.validate()

        const bodyErrors = this.body.validate()

        return subnodeErrors.concat(bodyErrors)
    }
}
