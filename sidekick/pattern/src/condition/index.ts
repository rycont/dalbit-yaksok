import { ClassType } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'
import { EnumCondition } from './enum.ts'

type ChainInput<C> = C extends Chain<infer U, unknown, unknown> ? U : unknown
export type Matcher<SelectShape, MetaShape> = {
    id: unknown
    meta: MetaShape
    func: (arg1: unknown, input: unknown) => SelectShape | false
}

export class Chain<InputShape, SelectShape, MetaShape> {
    private paths: MatchCondition[] = []
    private metaContent: unknown = {}

    declare private readonly _: InputShape

    public static [FieldCondition.methodName]<
        const EntryType extends Record<
            string,
            Chain<unknown, unknown, unknown>
        >,
    >(entries: EntryType) {
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
    >(entries: EntryType) {
        const condition = new FieldCondition(entries)
        this.paths.push(condition)

        return this as Chain<
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
    }

    public static [InstanceCondition.methodName]<T extends ClassType>(
        classType: T,
    ) {
        return new Chain().instance(classType)
    }

    public [InstanceCondition.methodName]<T extends ClassType>(classType: T) {
        const condition = new InstanceCondition(classType)
        this.paths.push(condition)

        this.meta = Object.assign({}, this.meta, {
            classShape: classType,
        })

        return this as unknown as Chain<
            InstanceType<T>,
            SelectShape,
            MetaShape & {
                classShape: T
            }
        >
    }

    public static [LiteralCondition.methodName]<
        const LiteralType extends string | number | boolean,
    >(literal: LiteralType) {
        return new Chain().literal(literal)
    }

    public [LiteralCondition.methodName]<
        const LiteralType extends string | number | boolean,
    >(literal: LiteralType) {
        const condition = new LiteralCondition(literal)
        this.paths.push(condition)

        return this as unknown as Chain<LiteralType, SelectShape, MetaShape>
    }

    public static [SelectCondition.methodName](name: string) {
        return new Chain().select(name)
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
    public [SelectCondition.methodName](name?: string, refine?: () => unknown) {
        const condition = new SelectCondition(name, refine)
        this.paths.push(condition)

        return this as unknown
    }

    public static [EnumCondition.methodName]<const Options extends string[]>(
        options: Options,
    ) {
        return new Chain().enum(options)
    }

    public [EnumCondition.methodName]<Options extends string[]>(
        options: Options,
    ) {
        const condition = new EnumCondition(options)
        this.paths.push(condition)

        return this as unknown as Chain<
            InputShape & Options[number],
            SelectCondition,
            MetaShape
        >
    }

    public meta<const T extends {}>(content: T) {
        this.metaContent = Object.assign({}, this.metaContent, content)
        return this as unknown as Chain<InputShape, SelectShape, MetaShape & T>
    }

    public buildField(accessor: string, requester: GlobalRequester) {
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

        const requester: GlobalRequester = {
            newArg: (value: unknown) => {
                const name = `${argArrayName}[${args.size}]`
                args.set(name, value)

                return name
            },
            selectJar: () => {
                return selectJarName
            },
        }

        const body = `const ${selectJarName} = {};\n${this.buildField(inputName, requester)}\nreturn ${selectJarName}`

        const func = Chain.functionObjectCache.getOrInsertComputed(body, () => {
            return new Function(argArrayName, inputName, body)
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
