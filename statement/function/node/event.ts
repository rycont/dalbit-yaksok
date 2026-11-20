import {
    Block,
    Token,
    ValueType,
    YaksokError,
    Scope,
    Statement,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'
import { FunctionDeclareHeader } from './header'
import { FunctionObject } from '../value/function'
import { EventSubscriptionObject } from '../value/event'

export class SubscribeEvent implements Statement {
    static friendlyName = '이벤트 구독하기'
    public parsingErrors: YaksokError[] = []

    constructor(
        private readonly declareHeader: FunctionDeclareHeader,
        private readonly body: Block,
        private invokingArguments: InvokingArguments,
        public readonly tokens: Token[],
    ) {}

    async execute(scope: Scope): Promise<void> {
        const args = await this.invokingArguments.execute(scope)

        const argsWithBodySymbol = new Map<string | symbol, ValueType>(args)

        argsWithBodySymbol.set(
            EventSubscriptionObject.CALLBACK_BODY_KEY,
            new FunctionObject(
                '익명함수',
                this.body,
                { rd: [], sr: [] },
                scope,
            ),
        )

        void this.declareHeader.runnable!.run(argsWithBodySymbol)
    }

    validate(invokingScope: Scope): YaksokError[] {
        const subnodeErrors = this.invokingArguments.validate(invokingScope)

        const eventOccuredScope = new Scope({
            parent: invokingScope,
            initialVariable: Object.fromEntries(
                this.invokingArguments.argumentValues
                    .keys()
                    .map((k) => [k, new ValueType()]),
            ),
        })

        const bodyErrors = this.body.validate(eventOccuredScope)

        return subnodeErrors.concat(bodyErrors)
    }
}
