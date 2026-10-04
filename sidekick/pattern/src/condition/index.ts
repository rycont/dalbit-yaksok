import type { ClassType } from '@dalbit-yaksok/pattern'
import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'
import { EnumCondition } from './enum.ts'
import { ListCondition } from './list.ts'
import { SpaceCondition } from './space.ts'
import { ExistCondition } from './exist.ts'
import { ChainShapeBase, UpdateShape } from '../common.ts'

export type Matcher<Shape extends ChainShapeBase> = {
    id: unknown
    meta: Shape['Meta']
    func: (
        arg1: unknown,
        input: unknown,
        selectJar?: unknown,
    ) => Shape['Select'] | false
}

export class Chain<
    Shape extends ChainShapeBase<unknown> = ChainShapeBase<unknown>,
> {
    declare private readonly _: Shape['Input']

    constructor(
        private paths: MatchCondition[] = [],
        private metaContent: unknown = {},
    ) {}

    public static type() {
        return new Chain()
    }

    public static [ExistCondition.methodName]() {
        return new Chain().exist()
    }

    public [ExistCondition.methodName]() {
        const condition = new ExistCondition()
        this.paths.push(condition)
    }

    public static [ListCondition.methodName](subchains) {
        return new Chain().list(subchains)
    }

    public [ListCondition.methodName](subchains) {
        const condition = new ListCondition(subchains)
        this.paths.push(condition)
    }

    public static [SpaceCondition.methodName]() {
        return new Chain().space()
    }

    public [SpaceCondition.methodName]() {
        const condition = new SpaceCondition()
        this.paths.push(condition)

        this.metaContent = Object.assign({}, this.metaContent, {
            spread: true,
        })
    }

    public static [FieldCondition.methodName](entries) {
        return new Chain().field(entries)
    }

    public get [FieldCondition.methodName]() {
        return FieldCondition.creater(this)
    }

    public pipe<NewShape extends ChainShapeBase>(c: MatchCondition) {
        return new Chain<NewShape>(this.paths.concat(c), this.metaContent)
    }

    public static [InstanceCondition.methodName]<
        InputClassType extends ClassType,
    >(classType: InputClassType) {
        return new Chain().instance(classType)
    }

    public [InstanceCondition.methodName]<InputClassType extends ClassType>(
        classType: InputClassType,
    ) {
        const condition = new InstanceCondition(classType)

        return new Chain<
            UpdateShape<
                Shape,
                {
                    Input: InstanceType<InputClassType>
                    Meta: Shape['Meta'] & {
                        classShape: InputClassType
                    }
                }
            >
        >(
            this.paths.concat(condition),
            Object.assign({}, this.metaContent, {
                classShape: classType,
            }),
        )
    }

    public static [LiteralCondition.methodName]<
        LiteralType extends string | number | boolean,
    >(literal: LiteralType) {
        return new Chain().literal(literal)
    }

    public [LiteralCondition.methodName]<
        LiteralType extends string | number | boolean,
    >(literal: LiteralType) {
        const condition = new LiteralCondition(literal)

        return new Chain<
            UpdateShape<
                Shape,
                {
                    Input: Shape['Input'] & LiteralType
                }
            >
        >(this.paths.concat(condition), this.metaContent)
    }

    public static [SelectCondition.methodName]<R>(name?: string) {
        return new Chain<ChainShapeBase<R>>().select(name)
    }

    public get [SelectCondition.methodName]() {
        return SelectCondition.creater(this)
    }

    public static [EnumCondition.methodName](options: string[]) {
        return new Chain().enum(options)
    }

    public [EnumCondition.methodName](options: string[]) {
        const condition = new EnumCondition(options)
        this.paths.push(condition)
    }

    public meta(content) {
        this.metaContent = Object.assign({}, this.metaContent, content)
    }

    public buildField(accessor: string, requester: GlobalRequester): string {
        return this.paths
            .map((m) => m.createStatement(accessor, requester))
            .join('\n')
    }

    private callerCache: ReturnType<(typeof this)['compile']> | null = null

    public compile(): Matcher<Shape> {
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
