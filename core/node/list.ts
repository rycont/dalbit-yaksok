import {
    BrokenBracketError,
    Evaluable,
    Expression,
    IndexedValue,
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListValue,
    Node,
    NotExecutableNodeError,
    NotProperIndexKeyType,
    NumberValue,
    Scope,
    StringIndexOutOfRangeError,
    StringValue,
    SubnodeScheme,
    TargetIsNotIndexedValueError,
    Token,
    TupleNotMutableError,
    TupleValue,
    ValueType,
    YaksokError,
    RunFrame,
} from '@dalbit-yaksok/core'
import { blue } from '../util/terminal.ts'

export class Sequence extends Node {
    static override friendlyName = '나열된 값'

    constructor(
        public items: Evaluable[],
        public override tokens: Token[],
    ) {
        super()
    }

    override validate(): YaksokError[] {
        return [
            new NotExecutableNodeError({
                tokens: this.tokens,
                node: this,
                scope: this.scope,
            }),
        ]
    }
}

export class ListLiteral extends Evaluable<Evaluable[]> {
    static override friendlyName = '목록'

    constructor(
        items: Evaluable[],
        public closingBracket: Expression | null,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = items
    }

    override async execute(runFrame: RunFrame): Promise<ListValue> {
        const evaluatedItems = await Promise.all(
            this.subnode.map((item) => item.execute(runFrame)),
        )

        const value = new ListValue(evaluatedItems)
        return value
    }

    override validate(): YaksokError[] {
        const errors = this.subnode
            .flatMap((item) => item.validate())
            .filter((error): error is YaksokError => !!error)

        const bracketErrors = this.closingBracket
            ? []
            : [
                  new BrokenBracketError({
                      resource: {
                          message: `목록에는 닫는 괄호가 필요해요. 쉼표로 값을 나열하고 나서, ${blue(']')}로 목록을 닫아주세요.`,
                      },
                      node: this,
                      scope: this.scope,
                  }),
              ]

        return errors.concat(bracketErrors)
    }
}

export class TupleLiteral extends Evaluable<Evaluable[]> {
    static override friendlyName = '튜플'

    constructor(
        subnode: Evaluable[],
        public override tokens: Token[],
    ) {
        super()
        this.subnode = subnode
    }

    override async execute(runFrame: RunFrame): Promise<TupleValue> {
        const evaluatedItems = await Promise.all(
            this.subnode.map((item) => item.execute(runFrame)),
        )

        const value = new TupleValue(evaluatedItems)
        return value
    }

    override validate(): YaksokError[] {
        const errors = this.subnode
            .flatMap((item) => item.validate())
            .filter((error): error is YaksokError => !!error)

        return errors
    }
}

export class IndexFetch extends Evaluable {
    static override friendlyName = '사전에서 값 가져오기'

    constructor(
        public list: Evaluable<SubnodeScheme>,
        public index: Evaluable<SubnodeScheme>,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(runFrame: RunFrame): Promise<ValueType> {
        const list = await this.list.execute(runFrame)
        const index = await this.index.execute(runFrame)

        if (list instanceof StringValue) {
            if (!(index instanceof NumberValue)) {
                throw new NotProperIndexKeyType({
                    scope: runFrame,
                    tokens: this.index.tokens,
                    resource: {
                        index,
                        targetNode: this.list,
                        targetValue: list,
                    },
                })
            }

            try {
                ListValue.assertProperIndex(index.value)
            } catch (error) {
                if (error instanceof YaksokError && !error.tokens) {
                    error.tokens = this.index.tokens
                }

                throw error
            }

            if (index.value >= list.value.length) {
                throw new StringIndexOutOfRangeError({
                    tokens: this.tokens,
                    resource: {
                        target: list,
                        index: index.value,
                        length: list.value.length,
                    },
                })
            }

            return new StringValue(list.value[index.value])
        }

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                tokens: this.tokens,
                resource: {
                    target: this.list,
                },
            })
        }

        if (index instanceof ListValue) {
            const values = list.getItemsFromKeys(index)
            return values
        }

        if (index instanceof StringValue || index instanceof NumberValue) {
            try {
                const value = list.getItem(index.value)
                return value
            } catch (e) {
                if (e instanceof ListIndexMustBeGreaterOrEqualThan0Error) {
                    e.scope = runFrame
                    e.tokens = this.index.tokens
                } else if (e instanceof NotProperIndexKeyType) {
                    e.scope = runFrame
                    e.resource = {
                        index,
                        targetNode: this.list,
                        targetValue: list,
                    }
                    e.tokens = this.index.tokens
                } else if (e instanceof YaksokError) {
                    e.scope = runFrame
                    e.tokens = this.index.tokens
                }

                throw e
            }
        }

        throw new NotProperIndexKeyType({
            scope: runFrame,
            tokens: this.index.tokens,
            resource: {
                index,
                targetNode: this.list,
                targetValue: list,
            },
        })
    }

    public async setValue(scope: Scope, value: ValueType) {
        const list = await this.list.execute(scope)
        const index = await this.index.execute(scope)

        if (list instanceof TupleValue) {
            throw new TupleNotMutableError({
                tokens: this.tokens,
                resource: {},
            })
        }

        if (!(list instanceof IndexedValue)) {
            throw new TargetIsNotIndexedValueError({
                tokens: this.tokens.slice(0, -1),
                resource: {
                    target: this.list,
                },
            })
        }

        if (
            !(index instanceof NumberValue) &&
            !(index instanceof StringValue)
        ) {
            throw new NotProperIndexKeyType({
                scope,
                tokens: this.index.tokens,
                resource: {
                    index,
                    targetNode: this.list,
                    targetValue: list,
                },
            })
        }

        list.setItem(index.value, value)
    }

    override validate(): YaksokError[] {
        const errors = [
            ...(this.list.validate() || []),
            ...(this.index.validate() || []),
        ]

        return errors
    }
}
