import {
    Block,
    Executable,
    Token,
    ValueType,
    YaksokError,
    Scope,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'
import { FunctionDeclareHeader } from './header'
import { FunctionObject } from '../value/function'
import { EventSubscriptionObject } from '../value/event'

export class SubscribeEvent extends Executable<InvokingArguments> {
    static override friendlyName = '이벤트 구독하기'

    constructor(
        private readonly declareHeader: FunctionDeclareHeader,
        private readonly body: Block,
        invokingArguments: InvokingArguments,
        public override readonly tokens: Token[],
    ) {
        super()

        this.subnode = invokingArguments
    }

    override async execute(scope: Scope): Promise<void> {
        const args = await this.subnode.execute(scope)

        const argsWithBodySymbol = new Map<string | symbol, ValueType>(args)

        argsWithBodySymbol.set(
            EventSubscriptionObject.CALLBACK_BODY_KEY,
            new FunctionObject('익명함수', this.body, [], scope),
        )

        void this.declareHeader.runnable!.run(argsWithBodySymbol)
    }

    override validate(invokingScope: Scope): YaksokError[] {
        const subnodeErrors = this.subnode.validate(invokingScope)

        const eventOccuredScope = new Scope({
            parent: invokingScope,
            initialVariable: Object.fromEntries(
                this.subnode.entries.keys().map((k) => [k, new ValueType()]),
            ),
        })

        const bodyErrors = this.body.validate(eventOccuredScope)

        return subnodeErrors.concat(bodyErrors)
    }
}
