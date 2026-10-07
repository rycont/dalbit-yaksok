import { GlobalRequester, MatchCondition } from './base.ts'
import { FieldCondition } from './field.ts'
import { InstanceCondition } from './instance.ts'
import { LiteralCondition } from './literal.ts'
import { SelectCondition } from './select.ts'
import { ListCondition } from './list.ts'
import { ExistCondition } from './exist.ts'
import { ChainShapeBase } from '../common.ts'

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

    public static get [ExistCondition.methodName]() {
        return new Chain().exist
    }

    public get [ExistCondition.methodName]() {
        return ExistCondition.creater(this)
    }

    public static get [LiteralCondition.methodName]() {
        return new Chain().literal
    }

    public get [LiteralCondition.methodName]() {
        return LiteralCondition.creater(this)
    }

    public static get [FieldCondition.methodName]() {
        return new Chain().field
    }

    public get [FieldCondition.methodName]() {
        return FieldCondition.creater(this)
    }

    public static get [InstanceCondition.methodName]() {
        return new Chain().instance
    }

    public get [InstanceCondition.methodName]() {
        return InstanceCondition.creater(this)
    }

    public static get [SelectCondition.methodName]() {
        return new Chain().select
    }

    public get [SelectCondition.methodName]() {
        return SelectCondition.creater(this)
    }

    public static get [ListCondition.methodName]() {
        return new Chain().list
    }

    public get [ListCondition.methodName]() {
        return ListCondition.creater(this)
    }

    public pipe<NewShape extends ChainShapeBase>(c: MatchCondition) {
        return new Chain<NewShape>(this.paths.concat(c), this.metaContent)
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
