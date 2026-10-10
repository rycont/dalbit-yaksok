import type { Chain } from '@dalbit-yaksok/pattern'

export type UnionToIntersection<T> = (
    T extends any ? (x: T) => any : never
) extends (x: infer R) => any
    ? R
    : never

export type ClassType<T extends unknown = unknown> = new (...args: any[]) => T

class RequestFieldName {
    constructor(public setName: (name: string) => void) {}
}

export const signals = {
    RequestFieldName,
}

export type ValueTraits = {
    exists: 'exists'
    multiple: 'multiple'
}

export type TypePlaceholder<
    Traits extends (keyof ValueTraits)[] = (keyof Partial<ValueTraits>)[],
> = symbol & {
    _type: 'type_placeholder'
    traits: Traits
}

export type PlaceholderTraits<P extends TypePlaceholder> =
    P extends TypePlaceholder<infer U> ? U : never

export type ApplyTrait<
    Trait extends keyof ValueTraits,
    V,
> = Trait extends ValueTraits['exists']
    ? NonNullable<V>
    : Trait extends ValueTraits['multiple']
      ? V[]
      : never

export type UnpackTypePlaceholder<
    V,
    Traits extends (keyof ValueTraits)[],
> = [] extends Traits
    ? V
    : Traits extends [
            infer FirstTrait extends keyof ValueTraits,
            ...infer Left extends (keyof ValueTraits)[],
        ]
      ? UnpackTypePlaceholder<ApplyTrait<FirstTrait, V>, Left>
      : never

export type Fallback<T, Fallbacked> = [unknown] extends T ? Fallbacked : T

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
