import {
    ValueType,
    YaksokSession,
    CodeFile,
    RuleList,
    concatRuleList,
    Slot,
    Brand,
    EmptyValue,
} from '@dalbit-yaksok/core'
import util from 'node:util'

export type SlotKey = Brand<symbol, 'SlotKey'>

export class Scope {
    parent: Scope | null

    public slots = new Map<SlotKey, Slot>()

    public readonly id: string = crypto.randomUUID()

    public readonly session: YaksokSession
    public readonly codeFile?: CodeFile

    public ruleList: RuleList

    constructor(
        config:
            | {
                  codeFile?: CodeFile
                  session: YaksokSession
              }
            | {
                  parent: Scope
              },
    ) {
        if ('session' in config) {
            this.parent = config.session.baseFrame?.scope || null
            this.codeFile = config.codeFile
            this.session = config.session

            const extendedRules = {
                rd: config.session.extensions.flatMap(
                    (e) => e.capabilties.Grammer || [],
                ),
                sr: [],
            }

            this.ruleList = extendedRules
        } else {
            this.parent = config.parent
            this.session = config.parent.session
            this.codeFile = config.parent.codeFile

            this.ruleList = {
                rd: [],
                sr: [],
            }
        }
    }

    public addSlot(slot: Slot): SlotKey {
        const key = Symbol(slot.name || undefined) as SlotKey
        this.slots.set(key, slot)

        return key
    }

    public *getSlotNames(): Generator<string | symbol> {
        yield* this.slots.keys()

        if (this.parent) {
            yield* this.parent.getSlotNames()
        }
    }

    findSlot(name: string): [SlotKey | null, Scope] {
        const slot = this.slots
            .entries()
            .find((entry) => entry[1].name === name)?.[0]

        if (slot) {
            return [slot, this]
        }

        if (this.parent) {
            return this.parent.findSlot(name)
        }

        return [null, this]
    }

    public *getRuleListStack(): Generator<RuleList> {
        if (this.ruleList) {
            yield this.ruleList
        }

        if (this.parent) {
            yield* this.parent.getRuleListStack()
        } else {
            return
        }
    }

    public addRuleList(ruleList: RuleList) {
        this.ruleList = concatRuleList([this.ruleList, ruleList])
    }
}

export interface RunFrame {
    get(key: SlotKey): ValueType
    set(key: SlotKey, value: ValueType): void
    createChild(scope: Scope): RunFrame
    readonly scope: Scope
}

export function createRunFrame(
    scope: Scope,
    parent: RunFrame | null,
): RunFrame {
    const values = new Map<SlotKey, ValueType>(
        scope.slots.keys().map((key) => [key, new EmptyValue()]),
    )

    const instance: RunFrame = {
        ...({
            [util.inspect.custom]() {
                console.log('\nRunFrame on Scope', scope.id)
                console.table(
                    Object.fromEntries(
                        values.entries().map(([k, v]) => [k.description, v]),
                    ),
                )
                return ''
            },
        } as {}),
        scope,
        get(key) {
            if (scope.slots.has(key)) {
                return values.get(key)!
            }

            if (parent) {
                return parent.get(key)
            }

            throw '그럴리가 없음'
        },
        set(key, value) {
            if (scope.slots.has(key)) {
                values.set(key, value)
                return
            }

            if (parent) {
                parent.set(key, value)
                return
            }

            throw new Error('얘도 말이 안됨')
        },
        createChild(childScope: Scope) {
            return createRunFrame(childScope, instance)
        },
    }

    return instance
}
