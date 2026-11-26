import {
    Block,
    Evaluable,
    IndexedValue,
    NodeCapability,
    NotEnumerableValueForListLoopError,
    onRunChild,
    RunFrame,
    Scope,
    SlotKey,
    Statement,
    StringValue,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'
import { ContinueSignal } from '../continue/signal'
import { BreakSignal } from '../break/signal'

export class ListLoop implements Statement {
    public parsingErrors: YaksokError[] = []

    static friendlyName = '목록 반복'
    static accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        public scope: Scope,
        public list: Evaluable,
        public indicator: SlotKey,
        public body: Block,
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame): Promise<void> {
        const list = await this.list.execute(runFrame)

        this.assertRepeatTargetIsList(list)

        try {
            for (const value of list.enumerate()) {
                await onRunChild({
                    scope: this.scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })

                const childFrame = runFrame.createChild(this.body.scope)
                childFrame.set(this.indicator, value)

                try {
                    await this.body.execute(childFrame)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    assertRepeatTargetIsList(
        target: ValueType,
    ): asserts target is IndexedValue | StringValue {
        if (target instanceof IndexedValue || target instanceof StringValue) {
            return
        }

        throw new NotEnumerableValueForListLoopError({
            resource: {
                value: target,
            },
            tokens: this.list.tokens,
        })
    }

    validate(): YaksokError[] {
        const listErrors = this.list.validate()
        const bodyErrors = this.body.validate()

        return [...listErrors, ...bodyErrors]
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}
