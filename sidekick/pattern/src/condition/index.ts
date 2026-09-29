import { ClassType } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'
import { EnumCondition } from './enum.ts'

type ChainInput<C> = C extends Chain<infer U, unknown> ? U : unknown

export class Chain<InputShape, SelectShape> {
    private paths: MatchCondition[] = []

    declare private readonly _: InputShape

    public static [FieldCondition.methodName]<
        const EntryType extends Record<string, Chain<unknown, unknown>>,
    >(entries: EntryType) {
        return new Chain().field(entries)
    }

    public [FieldCondition.methodName]<
        const EntryType extends {
            [key in keyof Partial<InputShape>]: Chain<
                Partial<InputShape[key]>,
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
                        true
                    >
                        ? key
                        : EntryType[key] extends Chain<
                                unknown,
                                infer U extends string
                            >
                          ? U
                          : never
                ]: ChainInput<EntryType[key]>
            }
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

        return this as unknown as Chain<
            InstanceType<typeof classType>,
            SelectShape
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

        return this as unknown as Chain<LiteralType, SelectShape>
    }

    public static [SelectCondition.methodName](name: string) {
        return new Chain().select(name)
    }

    public [SelectCondition.methodName]<
        const T extends string,
        const RefineReturnType,
        const R extends (v: InputShape) => RefineReturnType,
    >(name: T, refine: R): Chain<RefineReturnType, T>
    public [SelectCondition.methodName]<const T extends string>(
        name: T,
    ): Chain<InputShape, T>
    public [SelectCondition.methodName](): Chain<InputShape, true>
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
            SelectCondition
        >
    }

    public buildField(accessor: string, requester: GlobalRequester) {
        return this.paths
            .map((m) => m.createStatement(accessor, requester))
            .join('\n')
    }

    public build() {
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

        const func = Chain.buildCache.getOrInsertComputed(body, () => {
            return new Function(argArrayName, inputName, body)
        }) as (arg1: unknown, input: unknown) => SelectShape | false

        console.log(body)

        return { id: args.values().toArray(), func }
    }

    static buildCache = new Map<string, Function>()
}
