import { Scope } from '../executer/scope.ts'
import { ValueType, ObjectValue } from '../value/base.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { Block } from './block.ts'
import { FunctionInvoke } from './function.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { YaksokError } from '../error/common.ts'

export class DeclareClass extends Executable {
    static override friendlyName = '클래스 선언'

    constructor(
        public name: string,
        public params: string[],
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope): Promise<void> {
        const classValue = new ClassValue(this.name, this.params, this.body, scope)
        scope.setVariable(this.name, classValue)
    }

    override validate(scope: Scope): YaksokError[] {
        const dummyClass = new ClassValue(this.name, this.params, this.body, scope)
        scope.setVariable(this.name, dummyClass)

        const classScope = new Scope({
            parent: scope,
        })

        for (const param of this.params) {
            classScope.setVariable(param, new ValueType())
        }

        return this.body.validate(classScope)
    }

    override toPrint(): string {
        return `클래스 ${this.name}(${this.params.join(', ')})`
    }
}

export class ClassValue extends ValueType {
    static override friendlyName = '클래스'

    constructor(
        public name: string,
        public params: string[],
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

        for (let i = 0; i < classValue.params.length; i++) {
            const paramName = classValue.params[i]
            const argValue = await (this.arguments_[i] || new ValueType()).execute(scope)
            instanceScope.setVariable(paramName, argValue)
        }

        await classValue.body.execute(instanceScope)

        return new InstanceValue(classValue.name, instanceScope)
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

    constructor(public className: string, public scope: Scope) {
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

        return instance.scope.getVariable(this.memberName)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.target.validate(scope)
    }

    override toPrint(): string {
        return `${this.target.toPrint()}.${this.memberName}`
    }
}
