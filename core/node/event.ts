import { Scope, YaksokError } from '@dalbit-yaksok/core'
import {
    errorToMachineReadable,
    renderErrorString,
} from '../error/render-error-string.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { Evaluable, Executable } from './base.ts'
import { Block } from './block.ts'
import { evaluateParams } from './function.ts'

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

export class SubscribeEvent extends Executable {
    static override friendlyName = '이벤트 구독하기'

    constructor(
        private eventId: string,
        private body: Block,
        private argumentEvaluator: Record<string, Evaluable>,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const param = await evaluateParams(this.argumentEvaluator, scope)
        const session = scope.session

        session.aliveListeners.push(
            new Promise((resolve) => {
                session.eventCreation.pub(this.eventId, [
                    param,
                    async () => {
                        const subScope = new Scope({
                            parent: scope,
                            initialVariable: param,
                        })

                        try {
                            await this.body.execute(subScope)
                        } catch (e) {
                            if (e instanceof YaksokError) {
                                session.stderr(
                                    renderErrorString(e),
                                    errorToMachineReadable(e),
                                    e,
                                )
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

    override validate(scope: Scope): YaksokError[] {
        return Object.values(this.argumentEvaluator).flatMap((v) =>
            v.validate(scope),
        )
    }
}
