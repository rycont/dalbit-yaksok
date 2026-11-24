import {
    ObjectValue,
    type ValueType,
    type RunnableObject,
    RunnableCapability,
    Runnable,
    RunFrame,
    SlotKey,
} from '@dalbit-yaksok/core'

export class FFIObject extends ObjectValue implements RunnableObject {
    public [Runnable]: RunnableCapability

    constructor(
        name: string,
        code: string,
        runtime: string,
        declaredFrame: RunFrame,
    ) {
        super()

        this[Runnable] = {
            name,
            async run(args: Map<SlotKey, ValueType>): Promise<ValueType> {
                const result = await declaredFrame.scope.session.runFFI(
                    runtime,
                    code,
                    args,
                    declaredFrame,
                )

                return result
            },
        }
    }
}
