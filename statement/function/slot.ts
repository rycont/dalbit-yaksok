import { Slot } from '@dalbit-yaksok/core'

export const FUNCTION_SLOT_TYPE = Symbol('function')

export interface FunctionSlot extends Slot {
    readonly type: typeof FUNCTION_SLOT_TYPE
    readonly name: string
}

export function createFunctionSlot(name: string): FunctionSlot {
    return {
        type: FUNCTION_SLOT_TYPE,
        name: name,
    }
}

export const PARAMETER_SLOT_TYPE = Symbol('parameter')

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
