import { ClassType } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'

type ChainInput<C> = C extends Chain<infer U, unknown> ? U : unknown
type ChainSelectName<C> =
    C extends Chain<unknown, infer U extends string>
        ? string extends U
            ? never
            : U
        : never

export class Chain<InputShape, SelectShape> {
    private paths: MatchCondition[] = []

    public static [FieldCondition.methodName]<
        const EntryType extends Record<string, Chain<unknown, unknown>>,
    >(entries: EntryType) {
        return new Chain().field(entries)
    }

    public [FieldCondition.methodName]<
        const EntryType extends {
            [key in keyof Partial<InputShape>]: Chain<InputShape[key], never>
        },
    >(entries: EntryType) {
        const condition = FieldCondition.create(entries)
        this.paths.push(condition)

        return this as Chain<
            InputShape & {
                [key in keyof EntryType]: ChainInput<EntryType[key]>
            },
            SelectShape & {
                [
                    key in keyof EntryType as ChainSelectName<EntryType[key]>
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
        const condition = InstanceCondition.create(classType)
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
        const condition = LiteralCondition.create(literal)
        this.paths.push(condition)

        return this as unknown as Chain<LiteralType, SelectShape>
    }

    public static [SelectCondition.methodName](name: string) {
        return new Chain().select(name)
    }

    public [SelectCondition.methodName]<const T extends string>(name: T) {
        const condition = new SelectCondition(name)
        this.paths.push(condition)

        return this as unknown as Chain<InputShape, T>
    }

    public buildField(accessor: string, requester: GlobalRequester) {
        return this.paths
            .map((m) => m.createStatement(accessor, requester))
            .join('\n')
    }

    public build() {
        const inputName = '$input'
        const selectJarName = '$select'

        const args = new Map<string, unknown>()

        const requester: GlobalRequester = {
            newArg: (value: unknown) => {
                const name = `$a[${args.size}]`
                args.set(name, value)

                return name
            },
            selectJar: () => {
                return selectJarName
            },
        }

        return this.buildField(inputName, requester)
    }
}
