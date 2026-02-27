import { Scope, YaksokError } from '@dalbit-yaksok/core'
import { Token } from '../prepare/tokenize/token.ts'
import { Evaluable, Executable } from './base.ts'
import { Block } from './block.ts'
import { evaluateParams } from './index.ts'

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

    override execute(_scope: Scope): Promise<void> {
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
    private params: Record<string, Evaluable>
    private target?: Evaluable

    constructor(
        props: {
            eventId: string
            body: Block
            params: Record<string, Evaluable>
            target?: Evaluable
        },
        public override tokens: Token[],
    ) {
        super()

        this.eventId = props.eventId
        this.body = props.body
        this.params = props.params
        this.target = props.target
    }

    override async execute(scope: Scope): Promise<void> {
        const param = await evaluateParams(this.params, scope)

        if (this.target) {
            param['자신'] = await this.target.execute(scope)
        }

        scope.codeFile?.session?.aliveListeners.push(
            new Promise((resolve) => {
                scope.codeFile?.session?.eventCreation.pub(this.eventId, [
                    param,
                    () => {
                        const subScope = new Scope({
                            parent: scope,
                            callerNode: this,
                            initialVariable: param,
                        })
                        return this.body.execute(subScope)
                    },
                    () => {
                        resolve()
                    },
                ])
            }),
        )

        return Promise.resolve()
    }

    override validate(scope: Scope): YaksokError[] {
        if (this.target) {
            return this.target.validate(scope)
        }

        return []
    }
}
