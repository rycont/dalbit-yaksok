import { Scope } from '../executer/scope.ts'
import { ObjectValue, ValueType } from '../value/base.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { Block } from './block.ts'
import { FunctionInvoke } from './function.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { YaksokError } from '../error/common.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'
import { assignerToOperatorMap } from './operator.ts'

export class DeclareClass extends Executable {
    static override friendlyName = '클래스 선언'

    constructor(
        public name: string,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const classValue = new ClassValue(this.name, this.body, scope)
        scope.setVariable(this.name, classValue)
    }

    override validate(scope: Scope): YaksokError[] {
        const dummyClass = new ClassValue(this.name, this.body, scope)
        scope.setVariable(this.name, dummyClass)

        const classScope = new Scope({
            parent: scope,
        })

        classScope.setVariable('자신', new InstanceValue(this.name, classScope))

        return this.body.validate(classScope)
    }

    override toPrint(): string {
        return `클래스 ${this.name}`
    }
}

export class ClassValue extends ValueType {
    static override friendlyName = '클래스'

    constructor(
        public name: string,
        public body: Block,
        public definitionScope: Scope,
    ) {
        super()
    }

    override toPrint(): string {
        return `<클래스 ${this.name}>`
    }
}

export class NewInstance extends Evaluable {
    static override friendlyName = '새 인스턴스 만들기'

    constructor(
        public className: string,
        public arguments_: Evaluable[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<InstanceValue> {
        const classValue = scope.getVariable(this.className)
        if (!(classValue instanceof ClassValue)) {
            throw new Error(`${this.className}은(는) 클래스가 아닙니다.`)
        }

        const instanceScope = new Scope({
            parent: classValue.definitionScope,
        })

        // Create instance early so 자신 is available during __준비__ execution
        const instance = new InstanceValue(classValue.name, instanceScope)

        // Inject 자신 (self) into instance scope
        instanceScope.variables['자신'] = instance

        // Execute class body (registers __준비__ and other methods/fields)
        await classValue.body.execute(instanceScope)

        // Call __준비__ (constructor) if it exists
        // Function names include params (e.g. "__준비__(이름)"), so use prefix match
        let initFunc: typeof instanceScope.functions extends Map<
            string,
            infer V
        >
            ? V | undefined
            : never = undefined

        for (const [name, func] of instanceScope.functions) {
            if (name.startsWith('__준비__')) {
                initFunc = func
                break
            }
        }

        if (initFunc) {
            const args: Record<string, ValueType> = {}

            for (let i = 0; i < initFunc.paramNames.length; i++) {
                const paramName = initFunc.paramNames[i]
                if (i < this.arguments_.length) {
                    args[paramName] = await this.arguments_[i].execute(scope)
                }
            }

            await initFunc.run(args, instanceScope)
        }
        // If no __준비__, args are silently ignored

        return instance
    }

    override validate(scope: Scope): YaksokError[] {
        return this.arguments_.flatMap((arg) => arg.validate(scope))
    }

    override toPrint(): string {
        return `새 ${this.className}`
    }
}

export class InstanceValue extends ObjectValue {
    static override friendlyName = '인스턴스'

    constructor(
        public className: string,
        public scope: Scope,
    ) {
        super()
    }

    override toPrint(): string {
        return `<${this.className} 인스턴스>`
    }
}

export class MemberFunctionInvoke extends Evaluable {
    static override friendlyName = '메서드 호출'

    constructor(
        public target: Evaluable,
        public invocation: FunctionInvoke,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const instance = await this.target.execute(scope)
        if (!(instance instanceof InstanceValue)) {
            throw new Error('온점(.)은 인스턴스에만 사용할 수 있습니다.')
        }

        instance.scope.variables['자신'] = instance

        return await this.invocation.execute(instance.scope)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.target.validate(scope)
    }

    override toPrint(): string {
        return `${this.target.toPrint()}.${this.invocation.name}`
    }
}

export class FetchMember extends Evaluable {
    static override friendlyName = '멤버 접근'

    constructor(
        public target: Evaluable,
        public memberName: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const instance = await this.target.execute(scope)
        if (!(instance instanceof InstanceValue)) {
            throw new Error('온점(.)은 인스턴스에만 사용할 수 있습니다.')
        }

        try {
            return instance.scope.getVariable(this.memberName)
        } catch (e) {
            if (!(e instanceof NotDefinedIdentifierError)) throw e

            // Variable not found — fall back to no-arg method invocation
            for (const [name, func] of instance.scope.functions) {
                if (
                    name === this.memberName ||
                    name.startsWith(this.memberName)
                ) {
                    instance.scope.variables['자신'] = instance
                    return await func.run({}, instance.scope)
                }
            }

            throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        return this.target.validate(scope)
    }

    override toPrint(): string {
        return `${this.target.toPrint()}.${this.memberName}`
    }
}

export class SetMember extends Executable {
    static override friendlyName = '멤버 설정'

    constructor(
        public target: Evaluable,
        public memberName: string,
        public value: Evaluable,
        private readonly operator: string,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const instance = await this.target.execute(scope)
        if (!(instance instanceof InstanceValue)) {
            throw new Error('온점(.)은 인스턴스에만 사용할 수 있습니다.')
        }

        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.value.execute(scope)
        let newValue = operand

        if (operatorNode) {
            const oldValue = instance.scope.getVariable(this.memberName)
            const tempOperator = new operatorNode(this.tokens)
            newValue = tempOperator.call(oldValue, operand)
        }

        instance.scope.variables[this.memberName] = newValue
    }

    override validate(scope: Scope): YaksokError[] {
        return [...this.target.validate(scope), ...this.value.validate(scope)]
    }

    override toPrint(): string {
        return `${this.target.toPrint()}.${this.memberName} ${this.operator} ...`
    }
}
