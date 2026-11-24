import {
    Block,
    Token,
    Scope,
    YaksokError,
    Statement,
    RunFrame,
    SlotKey,
} from '@dalbit-yaksok/core'
import { FFIObject } from '../value/ffi'
import { FunctionObject } from '../value/function'
import { EventSubscriptionObject } from '../value/event'

export class DeclareFunction implements Statement {
    static friendlyName = '새 약속 만들기'

    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        private slot: SlotKey,
        private body: Block,
        public tokens: Token[],
    ) {}

    execute(runFrame: RunFrame) {
        const runnable = new FunctionObject(
            this.scope.slots.get(this.slot)!.name,
            this.body,
            runFrame,
        )

        runFrame.set(this.slot, runnable)
        return Promise.resolve()
    }

    validate() {
        return []
    }
}

export class DeclareFFI implements Statement {
    static friendlyName = '번역 만들기'

    constructor(
        public scope: Scope,
        private name: string,
        private slotKey: SlotKey,
        public runtime: string,
        public body: string,
        public tokens: Token[],
    ) {}

    public parsingErrors: YaksokError[] = []

    execute(runFrame: RunFrame): Promise<void> {
        try {
            const runnable = new FFIObject(
                this.name,
                this.body,
                this.runtime,
                runFrame,
            )

            runFrame.set(this.slotKey, runnable)
            return Promise.resolve()
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    validate(): YaksokError[] {
        return this.parsingErrors
    }
}

export class DeclareEvent implements Statement {
    static friendlyName = '새 이벤트 만들기'
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        private eventId: string,
        private slotKey: SlotKey,
        private callbackSlotKey: SlotKey,
        public tokens: Token[],
    ) {}

    execute(runFrame: RunFrame): Promise<void> {
        // this.scope.events.set(this.eventId, this)

        runFrame.set(
            this.slotKey,
            new EventSubscriptionObject(
                this.eventId,
                this.callbackSlotKey,
                runFrame,
            ),
        )

        return Promise.resolve()
    }

    validate(): YaksokError[] {
        return this.parsingErrors
    }
}
