import {
    Block,
    Executable,
    Token,
    ValueType,
    YaksokError,
    renderErrorString,
    Scope,
} from '@dalbit-yaksok/core'
import { InvokingArguments } from './arguments'

export class SubscribeEvent extends Executable<InvokingArguments> {
    static override friendlyName = '이벤트 구독하기'

    constructor(
        private readonly eventId: string,
        private readonly body: Block,
        invokingArguments: InvokingArguments,
        public override readonly tokens: Token[],
    ) {
        super()

        this.subnode = invokingArguments
    }

    override async execute(scope: Scope): Promise<void> {
        const param = await this.subnode.execute(scope)
        const session = scope.session

        session.aliveListeners.push(
            new Promise((resolve) => {
                session.eventCreation.pub(this.eventId, [
                    param,
                    async () => {
                        const subScope = new Scope({
                            parent: scope,
                            initialVariable: Object.fromEntries(param),
                        })

                        try {
                            await this.body.execute(subScope)
                        } catch (e) {
                            if (e instanceof YaksokError) {
                                session.stderr(renderErrorString(e), e)
                            }
                            resolve()
                        }
                    },
                    () => {
                        resolve()
                    },
                    scope,
                ])
            }),
        )
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
