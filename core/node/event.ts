import {
    Block,
    Executable,
    InvokingArguments,
    renderErrorString,
    Scope,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'

export class DeclareEvent extends Executable {
    static override friendlyName = '새 이벤트 만들기'

    constructor(
        public eventId: string,
        public name: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override execute(_scope: Scope): Promise<void> {
        return Promise.resolve()
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
}

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

        return Promise.resolve()
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
