import { RunnableObject, Slot } from '@dalbit-yaksok/core'

const FUNCTION_SLOT_TYPE = 'function'

export interface FunctionSlot extends Slot {
    readonly name: string
    readonly runnable: RunnableObject
}

export function createFunctionSlot(
    name: string,
): [(runnable: RunnableObject) => void, FunctionSlot] {
    let storedRunnable: RunnableObject

    return [
        (runnable) => {
            storedRunnable = runnable
        },
        {
            type: FUNCTION_SLOT_TYPE,
            name: name,
            get runnable() {
                return storedRunnable
            },
        },
    ]
}

export const PARAMETER_SLOT_TYPE = 'parameter'

export interface ParameterSlot {
    readonly type: typeof PARAMETER_SLOT_TYPE
    readonly name: string
    readonly optional?: boolean
}

export function createParameterSlot(
    name: string,
    optional?: boolean,
): ParameterSlot {
    return {
        type: PARAMETER_SLOT_TYPE,
        optional,
        name,
    }
}
