import {
    Block,
    NumberValue,
    ObjectValue,
    RunFrame,
    Runnable,
    RunnableObject,
    SlotKey,
    ValueType,
} from '@dalbit-yaksok/core'
import { ReturnSignal } from '../signal.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'
    public [Runnable]: RunnableObject[typeof Runnable]

    constructor(name: string, body: Block, declaredFrame: RunFrame) {
        super()
        this[Runnable] = {
            name,
            async run(args: Map<SlotKey, ValueType>): Promise<ValueType> {
                try {
                    const childFrame = declaredFrame.createChild(body.scope)

                    for (const [slotKey, value] of args) {
                        childFrame.set(slotKey, value)
                    }

                    await body.execute(childFrame)
                } catch (e) {
                    if (e instanceof ReturnSignal) {
                        return e.value || DEFAULT_RETURN_VALUE
                    }

                    throw e
                }

                return DEFAULT_RETURN_VALUE
            },
        }
    }
}
