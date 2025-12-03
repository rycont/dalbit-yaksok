import { Scope, YaksokError } from '@dalbit-yaksok/core'
import { Token } from '../prepare/tokenize/token.ts'
import { Executable } from './base.ts'
import { Block } from './block.ts'

export class DeclareEvent extends Executable {
    static override friendlyName = '새 이벤트 만들기'

    private eventId: string
    private name: string

    constructor(
        props: { eventId: string; name: string },
        public override tokens: Token[],
    ) {
        super()

        this.eventId = props.eventId
        this.name = props.name
    }

    override execute(scope: Scope): Promise<void> {
        return Promise.resolve()
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
}

export class SubscribeEvent extends Executable {
    static override friendlyName = '이벤트 구독하기'

    private eventId: string
    private body: Block

    constructor(
        props: { eventId: string; body: Block },
        public override tokens: Token[],
    ) {
        super()

        this.eventId = props.eventId
        this.body = props.body
    }

    override execute(scope: Scope): Promise<void> {
        scope.codeFile?.session?.aliveListeners.push(
            new Promise((resolve) => {
                scope.codeFile?.session?.eventEndPubsub.sub(
                    this.eventId,
                    () => {
                        resolve()
                    },
                )
            }),
        )

        scope.codeFile?.session?.eventPubsub.sub(this.eventId, () => {
            const subScope = new Scope({ parent: scope })
            this.body.execute(subScope)
        })

        return Promise.resolve()
    }

    override validate(_scope: Scope): YaksokError[] {
        return []
    }
}
