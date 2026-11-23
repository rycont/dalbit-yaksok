import { SlotKey } from './scope'

export interface Slot {
    type: symbol
    name: string
}

export const ReferenceSlot = Symbol('ReferenceSlot')

export type ReferenceSlot = {
    [ReferenceSlot]: SlotKey
}

export function hasReferenceSlot<T>(thing: T): thing is T & ReferenceSlot {
    return (thing as any)[ReferenceSlot] !== undefined
}
