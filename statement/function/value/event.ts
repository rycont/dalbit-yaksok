import {
    ObjectValue,
    Scope,
    YaksokError,
    renderErrorString,
    type ValueType,
    type RunnableObject,
    RuleList,
} from '@dalbit-yaksok/core'
import { FunctionObject } from './function'

export class EventSubscriptionObject
    extends ObjectValue
    implements RunnableObject
{
    static CALLBACK_BODY_KEY = Symbol('EVENT_BODY_ARG_KEY')
    static override friendlyName = '번역'

    public paramNames: string[] = []

    constructor(
        public eventId: string,
        public invokeRules: RuleList,
        private declaredScope: Scope,
    ) {
        super()
    }

    public get name() {
        return this.eventId
    }

    run(args: Map<string | symbol, ValueType>): Promise<void> {
        const session = this.declaredScope.session
        const callback = args.get(EventSubscriptionObject.CALLBACK_BODY_KEY)

        if (!(callback instanceof FunctionObject)) {
            throw '왜그러세요..'
        }

        const argsWithoutSymbol = new Map(args)
        argsWithoutSymbol.delete(EventSubscriptionObject.CALLBACK_BODY_KEY)

        session.aliveListeners.push(
            new Promise((resolve) => {
                session.eventCreation.pub(this.eventId, [
                    argsWithoutSymbol as Map<string, ValueType>,
                    async () => {
                        try {
                            await callback.run(new Map())
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
                    this.declaredScope,
                ])
            }),
        )

        return Promise.resolve()
    }
}
