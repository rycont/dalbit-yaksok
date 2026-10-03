import type { ClassType } from '@dalbit-yaksok/pattern'
import type { Prettify } from '@dalbit-yaksok/core'
import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'
import { EnumCondition } from './enum.ts'
import { ListCondition } from './list.ts'
import { SpaceCondition } from './space.ts'

type ChainInput<C> =
    C extends Chain<infer U, unknown, unknown>
        ? unknown extends U
            ? never
            : U
        : never
type ChainSelect<C> =
    C extends Chain<unknown, infer U extends string, unknown> ? U : never

export type Matcher<SelectShape, MetaShape> = {
    id: unknown
    meta: MetaShape
    func: (
        arg1: unknown,
        input: unknown,
        selectJar?: unknown,
    ) => SelectShape | false
}

type FieldInstanceType<InputShape, SelectShape, MetaShape, EntryType> = Chain<
    InputShape & {
        [key in keyof EntryType]: ChainInput<EntryType[key]>
    },
    SelectShape & {
        [
            key in keyof EntryType as EntryType[key] extends Chain<
                unknown,
                true,
                unknown
            >
                ? key
                : EntryType[key] extends Chain<
                        unknown,
                        infer U extends string,
                        unknown
                    >
                  ? U
                  : never
        ]: ChainInput<EntryType[key]>
    },
    MetaShape
>

type InstanceChainType<
    _InputShape,
    SelectShape,
    MetaShape,
    T extends ClassType,
> = Chain<
    InstanceType<T>,
    SelectShape,
    MetaShape & {
        classShape: InstanceType<T>
    }
>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never

type ListChainType<
    _InputShape,
    _SelectShape,
    MetaShape,
    Subchains extends Chain<unknown, unknown, unknown>[],
> = Chain<
    {
        [K in keyof Subchains]: ChainInput<Subchains[K]>
    },
    Prettify<
        UnionToIntersection<
            {
                [K in keyof Subchains]: ChainSelect<Subchains[K]> extends never
                    ? {}
                    : {
                          [P in ChainSelect<Subchains[K]>]: ChainInput<
                              Subchains[K]
                          >
                      }
            }[number]
        >
    >,
    MetaShape
>

export class Chain<InputShape, SelectShape, MetaShape> {
    private paths: MatchCondition[] = []
    private metaContent: unknown = {}

    declare private readonly _: InputShape

    public static [ListCondition.methodName]<
        const Subchains extends Chain<unknown, unknown, unknown>[],
    >(
        subchains: Subchains,
    ): ListChainType<unknown, unknown, unknown, Subchains> {
        return new Chain().list(subchains)
    }

    public [ListCondition.methodName]<
        const Subchains extends Chain<unknown, unknown, unknown>[],
    >(
        subchains: Subchains,
    ): ListChainType<InputShape, SelectShape, MetaShape, Subchains> {
        const condition = new ListCondition(subchains)
        this.paths.push(condition)

        return this as unknown as ListChainType<
            InputShape,
            SelectShape,
            MetaShape,
            Subchains
        >
    }

    public static [SpaceCondition.methodName](): Chain<
        unknown[],
        unknown,
        unknown
    > {
        return new Chain().space()
    }

    public [SpaceCondition.methodName](): Chain<
        unknown[],
        SelectShape,
        MetaShape
    > {
        const condition = new SpaceCondition()
        this.paths.push(condition)

        this.metaContent = Object.assign({}, this.metaContent, {
            spread: true,
        })

        return this as unknown as Chain<unknown[], SelectShape, MetaShape>
    }

    public static [FieldCondition.methodName]<
        const EntryType extends Record<
            string,
            Chain<unknown, unknown, unknown>
        >,
    >(
        entries: EntryType,
    ): FieldInstanceType<unknown, unknown, unknown, EntryType> {
        return new Chain().field(entries)
    }

    public [FieldCondition.methodName]<
        const EntryType extends {
            [key in keyof Partial<InputShape>]: Chain<
                Partial<InputShape[key]>,
                unknown,
                unknown
            >
        },
    >(
        entries: EntryType,
    ): FieldInstanceType<InputShape, SelectShape, MetaShape, EntryType> {
        const condition = new FieldCondition(entries)
        this.paths.push(condition)

        return this as FieldInstanceType<
            InputShape,
            SelectShape,
            MetaShape,
            EntryType
        >
    }

    public static [InstanceCondition.methodName]<T extends ClassType>(
        classType: T,
    ): InstanceChainType<unknown, unknown, unknown, T> {
        return new Chain().instance(classType)
    }

    public [InstanceCondition.methodName]<T extends ClassType>(
        classType: T,
    ): InstanceChainType<InputShape, SelectShape, MetaShape, T> {
        const condition = new InstanceCondition(classType)
        this.paths.push(condition)

        this.metaContent = Object.assign({}, this.metaContent, {
            classShape: classType,
        })

        return this as unknown as InstanceChainType<
            InputShape,
            SelectShape,
            MetaShape,
            T
        >
    }

    public static [LiteralCondition.methodName]<
        const LiteralType extends string | number | boolean,
    >(literal: LiteralType): Chain<LiteralType, unknown, unknown> {
        return new Chain().literal(literal)
    }

    public [LiteralCondition.methodName]<
        const LiteralType extends string | number | boolean,
    >(literal: LiteralType): Chain<LiteralType, SelectShape, MetaShape> {
        const condition = new LiteralCondition(literal)
        this.paths.push(condition)

        return this as unknown as Chain<LiteralType, SelectShape, MetaShape>
    }

    public static [SelectCondition.methodName]<const T extends string>(
        name: string,
    ): Chain<unknown, T, unknown> {
        return new Chain().select(name) as Chain<unknown, T, unknown>
    }

    public [SelectCondition.methodName]<
        const T extends string,
        const RefineReturnType,
        const R extends (v: InputShape) => RefineReturnType,
    >(name: T, refine: R): Chain<RefineReturnType, T, MetaShape>
    public [SelectCondition.methodName]<const T extends string>(
        name: T,
    ): Chain<InputShape, T, MetaShape>
    public [SelectCondition.methodName](): Chain<InputShape, true, MetaShape>
    public [SelectCondition.methodName](
        name?: string,
        refine?: () => unknown,
    ): unknown {
        const condition = new SelectCondition(name, refine)
        this.paths.push(condition)

        return this as unknown
    }

    public static [EnumCondition.methodName]<const Options extends string[]>(
        options: Options,
    ): Chain<Options[number], unknown, unknown> {
        return new Chain().enum(options)
    }

    public [EnumCondition.methodName]<Options extends string[]>(
        options: Options,
    ): Chain<InputShape & Options[number], SelectShape, MetaShape> {
        const condition = new EnumCondition(options)
        this.paths.push(condition)

        return this as unknown as Chain<
            InputShape & Options[number],
            SelectShape,
            MetaShape
        >
    }

    public meta<const T extends {}>(
        content: T,
    ): Chain<InputShape, SelectShape, MetaShape & T> {
        this.metaContent = Object.assign({}, this.metaContent, content)
        return this as unknown as Chain<InputShape, SelectShape, MetaShape & T>
    }

    public buildField(accessor: string, requester: GlobalRequester): string {
        return this.paths
            .map((m) => m.createStatement(accessor, requester))
            .join('\n')
    }

    private callerCache: ReturnType<(typeof this)['compile']> | null = null

    public compile(): Matcher<SelectShape, MetaShape> {
        if (this.callerCache) {
            return this.callerCache
        }

        const inputName = '$input'
        const selectJarName = '$select'
        const argArrayName = '$a'

        const args = new Map<string, unknown>()
        let variableCounter = 0

        const requester: GlobalRequester = {
            newArg: (value: unknown) => {
                const name = `${argArrayName}[${args.size}]`
                args.set(name, value)

                return name
            },
            newVar: () => {
                return `$v${variableCounter++}`
            },
            selectJar: () => {
                return selectJarName
            },
        }

        const body = `${this.buildField(inputName, requester)}\nreturn ${selectJarName}`

        const func = Chain.functionObjectCache.getOrInsertComputed(body, () => {
            return new Function(
                argArrayName,
                inputName,
                `${selectJarName} = {}`,
                body,
            )
        })

        const builtCaller = {
            id: args.values().toArray(),
            func,
            meta: this.metaContent,
        } as ReturnType<(typeof this)['compile']>

        this.callerCache = builtCaller
        return builtCaller
    }

    private static functionObjectCache = new Map<string, Function>()
}
