import { Scope } from "../executer/scope.ts";
import { ObjectValue, ValueType } from "../value/base.ts";
import { Evaluable, Executable, Identifier } from "./base.ts";
import { Block } from "./block.ts";
import { FunctionInvoke } from "./function.ts";
import type { Token } from "../prepare/tokenize/token.ts";
import { YaksokError } from "../error/common.ts";
import {
  DotAccessOnlyOnInstanceError,
  InvalidParentClassError,
  NotAClassError,
} from "../error/class.ts";
import { NotDefinedIdentifierError } from "../error/variable.ts";
import { assignerToOperatorMap } from "./operator.ts";

export class DeclareClass extends Executable {
  static override friendlyName = "클래스 선언";

  constructor(
    public name: string,
    public body: Block,
    public override tokens: Token[],
    public parentName?: string,
  ) {
    super();
  }

  override async execute(scope: Scope): Promise<void> {
    const parentClass = this.resolveParentClass(scope);
    const classValue = new ClassValue(
      this.name,
      this.body,
      scope,
      parentClass,
    );
    scope.setVariable(this.name, classValue);
  }

  override validate(scope: Scope): YaksokError[] {
    const parentClass = this.resolveParentClass(scope);
    const dummyClass = new ClassValue(
      this.name,
      this.body,
      scope,
      parentClass,
    );
    scope.setVariable(this.name, dummyClass);

    const classScope = new Scope({
      parent: scope,
      allowFunctionOverride: true,
    });

    classScope.setVariable("자신", new InstanceValue(this.name, classScope));

    return this.body.validate(classScope);
  }

  private resolveParentClass(scope: Scope): ClassValue | undefined {
    if (!this.parentName) {
      return undefined;
    }

    const parentValue = scope.getVariable(this.parentName);
    if (!(parentValue instanceof ClassValue)) {
      throw new InvalidParentClassError({
        resource: {
          name: this.parentName,
        },
      });
    }

    return parentValue;
  }

  override toPrint(): string {
    return `클래스 ${this.name}`;
  }
}

export class ClassValue extends ValueType {
  static override friendlyName = "클래스";

  constructor(
    public name: string,
    public body: Block,
    public definitionScope: Scope,
    public parentClass?: ClassValue,
  ) {
    super();
  }

  override toPrint(): string {
    return `<클래스 ${this.name}>`;
  }
}

export class NewInstance extends Evaluable {
  static override friendlyName = "새 인스턴스 만들기";

  constructor(
    public className: string,
    public arguments_: Evaluable[],
    public override tokens: Token[],
  ) {
    super();
  }

  override async execute(scope: Scope): Promise<InstanceValue> {
    const classValue = scope.getVariable(this.className);
    if (!(classValue instanceof ClassValue)) {
      throw new NotAClassError({
        resource: {
          className: this.className,
        },
        tokens: this.tokens,
      });
    }

    const instanceScope = new Scope({
      parent: classValue.definitionScope,
      allowFunctionOverride: true,
    });

    // Create instance early so 자신 is available during __준비__ execution
    const instance = new InstanceValue(classValue.name, instanceScope);

    // Inject 자신 (self) into instance scope
    instanceScope.variables["자신"] = instance;

    // 부모 -> 자식 순으로 바디를 실행해 상속 체인을 구성합니다.
    const inheritanceChain = this.getInheritanceChain(classValue);
    for (const klass of inheritanceChain) {
      await klass.body.execute(instanceScope);
    }

    // Call __준비__ (constructor) if it exists
    const initFunc = this.pickConstructorByArity(
      instanceScope,
      this.arguments_.length,
    );

    if (initFunc) {
      const args: Record<string, ValueType> = {};

      for (let i = 0; i < initFunc.paramNames.length; i++) {
        const paramName = initFunc.paramNames[i];
        if (i < this.arguments_.length) {
          args[paramName] = await this.arguments_[i].execute(scope);
        }
      }

      await initFunc.run(args, instanceScope);
    }
    // If no __준비__, args are silently ignored

    return instance;
  }

  override validate(scope: Scope): YaksokError[] {
    return this.arguments_.flatMap((arg) => arg.validate(scope));
  }

  override toPrint(): string {
    return `새 ${this.className}`;
  }

  private getInheritanceChain(classValue: ClassValue): ClassValue[] {
    const chain: ClassValue[] = [];
    let cursor: ClassValue | undefined = classValue;

    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parentClass;
    }

    return chain;
  }

  private pickConstructorByArity(scope: Scope, arity: number) {
    const constructors = [...scope.functions.entries()]
      .filter(([name]) => name.startsWith("__준비__"))
      .map(([, func]) => func);

    if (constructors.length === 0) {
      return undefined;
    }

    return (
      constructors.find((func) => func.paramNames.length === arity) ??
        constructors[0]
    );
  }
}

export class InstanceValue extends ObjectValue {
  static override friendlyName = "인스턴스";

  constructor(
    public className: string,
    public scope: Scope,
  ) {
    super();
  }

  override toPrint(): string {
    return `<${this.className} 인스턴스>`;
  }
}

export class MemberFunctionInvoke extends Evaluable {
  static override friendlyName = "메서드 호출";

  constructor(
    public target: Evaluable,
    public invocation: FunctionInvoke,
    public override tokens: Token[],
  ) {
    super();
  }

  override async execute(scope: Scope): Promise<ValueType> {
    const instance = await this.target.execute(scope);
    if (!(instance instanceof InstanceValue)) {
      throw new DotAccessOnlyOnInstanceError({
        tokens: this.tokens,
      });
    }

    instance.scope.variables["자신"] = instance;

    return await this.invocation.execute(instance.scope);
  }

  override validate(scope: Scope): YaksokError[] {
    return this.target.validate(scope);
  }

  override toPrint(): string {
    return `${this.target.toPrint()}.${this.invocation.name}`;
  }
}

export class FetchMember extends Evaluable {
  static override friendlyName = "멤버 접근";

  constructor(
    public target: Evaluable,
    public memberName: string,
    public override tokens: Token[],
  ) {
    super();
  }

  override async execute(scope: Scope): Promise<ValueType> {
    const instance = await this.target.execute(scope);
    if (!(instance instanceof InstanceValue)) {
      throw new DotAccessOnlyOnInstanceError({
        tokens: this.tokens,
      });
    }

    try {
      return instance.scope.getVariable(this.memberName);
    } catch (e) {
      if (!(e instanceof NotDefinedIdentifierError)) throw e;

      // Variable not found — fall back to no-arg method invocation
      for (const [name, func] of instance.scope.functions) {
        if (name === this.memberName) {
          instance.scope.variables["자신"] = instance;
          return await func.run({}, instance.scope);
        }
      }

      throw e;
    }
  }

  override validate(scope: Scope): YaksokError[] {
    return this.target.validate(scope);
  }

  override toPrint(): string {
    return `${this.target.toPrint()}.${this.memberName}`;
  }
}

export class SetMember extends Executable {
  static override friendlyName = "멤버 설정";

  constructor(
    public target: Evaluable,
    public memberName: string,
    public value: Evaluable,
    private readonly operator: string,
    public override tokens: Token[],
  ) {
    super();
  }

  override async execute(scope: Scope): Promise<void> {
    const instance = await this.target.execute(scope);
    if (!(instance instanceof InstanceValue)) {
      throw new DotAccessOnlyOnInstanceError({
        tokens: this.tokens,
      });
    }

    const operatorNode = assignerToOperatorMap[
      this.operator as keyof typeof assignerToOperatorMap
    ];

    const operand = await this.value.execute(scope);
    let newValue = operand;

    if (operatorNode) {
      const oldValue = instance.scope.getVariable(this.memberName);
      const tempOperator = new operatorNode(this.tokens);
      newValue = tempOperator.call(oldValue, operand);
    }

    instance.scope.variables[this.memberName] = newValue;
  }

  override validate(scope: Scope): YaksokError[] {
    return [...this.target.validate(scope), ...this.value.validate(scope)];
  }

  override toPrint(): string {
    return `${this.target.toPrint()}.${this.memberName} ${this.operator} ...`;
  }
}
