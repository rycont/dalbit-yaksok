import { Slot } from '@dalbit-yaksok/core'

export const INDICATOR_SLOT_TYPE = Symbol('INDICATOR')

export function createItemIndicatorSlot(name: string): Slot {
    return {
        type: INDICATOR_SLOT_TYPE,
        name,
    }
}
