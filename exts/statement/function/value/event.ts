import {
    ObjectValue,
    YaksokError,
    renderErrorString,
    Runnable,
    RunnableCapability,
    isRunnable,
    SlotKey,
    RunFrame,
} from '@dalbit-yaksok/core'

export class EventSubscriptionObject extends ObjectValue {
    public [Runnable]: RunnableCapability

    constructor(
        eventId: string,
        callbackSlotKey: SlotKey,
        declaredFrame: RunFrame,
    ) {
        super()

        this[Runnable] = {
            name: eventId,
            run(args): Promise<void> {
                const session = declaredFrame.scope.session

                const callback = args.get(callbackSlotKey)

                if (!isRunnable(callback)) {
                    throw '왜그러세요..'
                }

                const argsWithReadableName = new Map(
                    args
                        .entries()
                        .map(([k, v]) => [
                            declaredFrame.scope.slots.get(k)?.name || k,
                            v,
                        ]),
                )

                session.aliveListeners.push(
                    new Promise<void>((resolve) => {
                        session.eventCreation.pub(eventId, [
                            argsWithReadableName,
                            async () => {
                                try {
                                    await callback[Runnable].run(new Map())
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
                            declaredFrame,
                        ])
                    }),
                )

                return Promise.resolve()
            },
        }
    }
}
