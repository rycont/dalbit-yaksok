import type { Chain } from '@dalbit-yaksok/pattern'

export type ClassType<T extends unknown = unknown> = new (...args: any[]) => T

class RequestFieldName {
    constructor(public setName: (name: string) => void) {}
}

export const signals = {
    RequestFieldName,
}

export type TypePlaceholderExists = symbol & {
    _type: 'type_placeholder_exists'
}

export type TypePlaceholder = symbol & {
    _type: 'type_placeholder'
}

export type KeyPlaceholder = symbol & {
    _type: 'key_placeholder'
}

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export interface ChainShapeBase<
    InputShape = unknown,
    SelectShape = unknown,
    MetaShape = unknown,
> {
    Input: InputShape
    Select: SelectShape
    Meta: MetaShape
}

export type ChainShape<C> = C extends Chain<infer U> ? U : never

export type UpdateShape<
    Origin extends ChainShapeBase,
    New extends Partial<ChainShapeBase>,
> = Prettify<Omit<Origin, keyof New> & New>
