import { Slot } from '@dalbit-yaksok/core'

const VARIABLE_SLOT_TYPE = Symbol('variable')

export function createVariableSlot(name: string): Slot {
    return {
        type: VARIABLE_SLOT_TYPE,
        name,
    }
}
