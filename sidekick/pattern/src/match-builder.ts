import { ClassType, SIGNALS } from './common.ts'
import { fields, FieldWorks } from './field.ts'

export class MatchBuilder<
    const T,
    FunctionReturnType extends unknown = unknown,
> {
    static inputName = '$input'

    private functionArguments = new Map<string, unknown>()
    private statements: string[] = []

    private newArgName(): string {
        return '$arg' + this.functionArguments.size
    }

    private variableCount = 0

    private newVar(hint: string): string {
        return `$var${this.variableCount++}_${hint}`
    }

    private jarName: string | undefined
    private getSelectJar() {
        if (this.jarName) {
            return this.jarName
        }

        this.jarName = this.newVar('selectjar')
        this.statements.push(`const ${this.jarName} = {}`)

        return this.jarName
    }

    public instance(
        instanceType: ClassType<T>,
    ): MatchBuilder<T, FunctionReturnType> {
        const classArg = this.newArgName()

        const condition = `if(!(${MatchBuilder.inputName} instanceof ${classArg})) {
    return false
}`
        this.statements.push(condition)
        this.functionArguments.set(classArg, instanceType)

        return this
    }

    public static instance<const T>(
        instanceType: ClassType<T>,
    ): MatchBuilder<T> {
        return new MatchBuilder<T>().instance(instanceType)
    }

    public fields<
        const Entries extends {
            [key in keyof T]?: FieldWorks
        },
        const ParserReturnValue = {
            [
                K in keyof T & keyof Entries as Entries[K] extends FieldWorks<
                    infer SelectedName
                >
                    ? SelectedName extends string
                        ? string extends SelectedName
                            ? never
                            : SelectedName
                        : SelectedName extends true
                          ? K
                          : never
                    : never
            ]: T[K]
        },
    >(content: Entries): MatchBuilder<T, ParserReturnValue> {
        this.statements = this.statements.concat(
            Object.entries(content)
                .filter((entry): entry is [string, FieldWorks] => !!entry[1])
                .map(([fieldName, field]) => {
                    const accessor = `${MatchBuilder.inputName}.${fieldName}`

                    try {
                        return field.createStatement(
                            accessor,
                            this.getSelectJar.bind(this),
                        )
                    } catch (e) {
                        if (e === SIGNALS.REQUEST_FOR_FIELD_NAME) {
                            return field
                                .select(fieldName)
                                .createStatement(
                                    accessor,
                                    this.getSelectJar.bind(this),
                                )
                        }

                        throw e
                    }
                })
                .join('\n'),
        )

        return this as unknown as MatchBuilder<T, ParserReturnValue>
    }

    public static literal<T>(content: T): FieldWorks<null> {
        const code = fields.literal(content)
        return new FieldWorks<null>(code)
    }

    public compile(): (input: unknown) => boolean | FunctionReturnType {
        const body =
            this.statements.join('\n') + `\nreturn ${this.jarName || true}`

        const argKeys = this.functionArguments.keys().toArray()
        const argValues = this.functionArguments.values().toArray()

        const f = new Function(...argKeys, MatchBuilder.inputName, body)
        return f.bind(null, ...argValues)
    }
}
