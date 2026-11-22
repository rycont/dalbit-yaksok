import {
    ValueType,
    YaksokSession,
    CodeFile,
    RuleList,
    concatRuleList,
    createMentioningRule,
    Slot,
    Brand,
    EmptyValue,
} from '@dalbit-yaksok/core'

export type SlotKey = Brand<symbol, 'SlotKey'>

export class Scope {
    parent: Scope | null

    public slots = new Map<SlotKey, Slot>()

    public readonly id: string = crypto.randomUUID()

    public readonly session: YaksokSession
    public readonly codeFile?: CodeFile

    private ruleList: RuleList
    private _finalized = false

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
            this.parent = config.session.baseScope
            this.codeFile = config.codeFile
            this.session = config.session

            const extendedRules = {
                rd: config.session.extensions.flatMap(
                    (e) => e.capabilties.Grammer || [],
                ),
                sr: [],
            }

            const mentionRule = Object.entries(config.session.files)
                .filter(([_, codeFile]) => codeFile.ranScope)
                .map(([fileName, codeFile]) =>
                    createMentioningRule(
                        fileName,
                        codeFile.ranScope.ruleList,
                        codeFile.ranScope,
                    ),
                )

            this.ruleList = concatRuleList(mentionRule.concat(extendedRules))
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

    public get finalized(): boolean {
        return this._finalized
    }

    public finalize(): void {
        this._finalized = true
    }

    public addSlot(slot: Slot): SlotKey {
        const key = Symbol(slot.name) as SlotKey
        this.slots.set(key, slot)

        return key
    }

    public *getSlotNames(): Generator<string | symbol> {
        yield* this.slots.keys()

        if (this.parent) {
            yield* this.parent.getSlotNames()
        }
    }

    findSlot(name: string): [SlotKey, Scope] {
        const slot = this.slots.entries().find(([_, s]) => s.name === name)?.[0]

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
}

export function createRunFrame(scope: Scope, parent?: RunFrame): RunFrame {
    const values = new Map<SlotKey, ValueType>(
        scope.slots.keys().map((key) => [key, new EmptyValue()]),
    )

    const instance: RunFrame = {
        get(key) {
            if (!scope.slots.has(key)) {
                return parent.get(key)
            }

            return values.get(key)
        },
        set(key, value) {
            if (!scope.slots.has(key)) {
                parent.set(key, value)
                return
            }

            values.set(key, value)
        },
        createChild(childScope: Scope) {
            return createRunFrame(childScope, instance)
        },
    }

    return instance
}
