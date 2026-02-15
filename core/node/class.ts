import { Scope } from "../executer/scope.ts";
import { ObjectValue, ValueType } from "../value/base.ts";
import { Evaluable, Executable, Identifier } from "./base.ts";
import { Block } from "./block.ts";
import { FunctionInvoke } from "./function.ts";
import type { Token } from "../prepare/tokenize/token.ts";
import type { RunnableObject } from "../value/function.ts";
import { YaksokError } from "../error/common.ts";
import {
  ConstructorArityMismatchError,
  DotAccessOnlyOnInstanceError,
  InvalidParentClassError,
  NotAClassError,
} from "../error/class.ts";
import { NotDefinedIdentifierError } from "../error/variable.ts";
import { assignerToOperatorMap } from "./operator.ts";

type MemberAccessTarget = InstanceValue | SuperValue;

function resolveMemberAccessTarget(
  target: ValueType,
  tokens: Token[],
): { scope: Scope; instance: InstanceValue } {
  if (target instanceof InstanceValue) {
    return {
      scope: target.scope,
      instance: target,
    };
  }

  if (target instanceof SuperValue) {
    return {
      scope: target.scope,
      instance: target.instance,
    };
  }

  throw new DotAccessOnlyOnInstanceError({
    tokens,
  });
}

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

    const dummyInstance = new InstanceValue(this.name);
    dummyInstance.scope = classScope;
    classScope.setVariable("자신", dummyInstance);
    if (this.parentName) {
      classScope.setVariable("상위", new SuperValue(dummyInstance, scope));
    }

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

    const rootScope = new Scope({
      parent: classValue.definitionScope,
      allowFunctionOverride: true,
    });

    // Create instance early so 자신 is available during __준비__ execution.
    // scope는 상속 체인 실행 후 할당됩니다.
    const instance = new InstanceValue(classValue.name);

    // 부모 -> 자식 순으로 바디를 실행해 상속 체인을 구성합니다.
    const inheritanceChain = this.getInheritanceChain(classValue);
    let currentScope = rootScope;

    for (const klass of inheritanceChain) {
      const layerScope = new Scope({
        parent: currentScope,
        allowFunctionOverride: true,
      });
      layerScope.setVariable("자신", instance);
      if (klass.parentClass) {
        layerScope.setVariable("상위", new SuperValue(instance, currentScope));
      }
      await klass.body.execute(layerScope);
      currentScope = layerScope;
    }
    instance.scope = currentScope;

    // Call __준비__ (constructor) if it exists
    const initFunc = this.pickConstructorByArity(
      instance.scope,
      this.arguments_.length,
      classValue.name,
    );

    if (initFunc) {
      const args: Record<string, ValueType> = {};

      for (let i = 0; i < initFunc.paramNames.length; i++) {
        const paramName = initFunc.paramNames[i];
        if (i < this.arguments_.length) {
          args[paramName] = await this.arguments_[i].execute(scope);
        }
      }

      await initFunc.run(args, instance.scope);
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

  private pickConstructorByArity(
    scope: Scope,
    arity: number,
    className: string,
  ): RunnableObject | undefined {
    const constructors: RunnableObject[] = [];
    const seen = new Set<string>();
    let cursor: Scope | undefined = scope;

    while (cursor) {
      for (const [name, func] of cursor.functions) {
        if (!name.startsWith("__준비__")) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        constructors.push(func);
      }
      cursor = cursor.parent;
    }

    if (constructors.length === 0) {
      return undefined;
    }

    const exactMatch = constructors.find(
      (func) => func.paramNames.length === arity,
    );
    if (exactMatch) {
      return exactMatch;
    }

    const expectedArities = [
      ...new Set(constructors.map((f) => f.paramNames.length)),
    ].sort((a, b) => a - b);
    throw new ConstructorArityMismatchError({
      resource: {
        className,
        expected: expectedArities,
        received: arity,
      },
      tokens: this.tokens,
    });
  }
}

export class InstanceValue extends ObjectValue {
  static override friendlyName = "인스턴스";

  /** 상속 체인 실행 후 NewInstance에서 할당됩니다. */
  public scope!: Scope;

  constructor(public className: string) {
    super();
  }

  override toPrint(): string {
    return `<${this.className} 인스턴스>`;
  }
}

export class SuperValue extends ObjectValue {
  static override friendlyName = "상위";

  constructor(
    public instance: InstanceValue,
    public scope: Scope,
  ) {
    super();
  }

  override toPrint(): string {
    return "<상위>";
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
    const rawTarget = await this.target.execute(scope);
    const resolved = resolveMemberAccessTarget(rawTarget, this.tokens);
    resolved.scope.variables["자신"] = resolved.instance;

    return await this.invocation.execute(resolved.scope);
  }

  override validate(scope: Scope): YaksokError[] {
    const targetErrors = this.target.validate(scope);
    const paramErrors = Object.values(this.invocation.params).flatMap(
      (param) => param.validate(scope),
    );
    return [...targetErrors, ...paramErrors];
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
    const rawTarget = await this.target.execute(scope);
    const resolved = resolveMemberAccessTarget(rawTarget, this.tokens);

    try {
      return resolved.scope.getVariable(this.memberName);
    } catch (e) {
      if (!(e instanceof NotDefinedIdentifierError)) throw e;

      // Variable not found — fall back to no-arg method invocation
      try {
        const func = resolved.scope.getFunctionObject(this.memberName);
        resolved.scope.variables["자신"] = resolved.instance;
        return await func.run({}, resolved.scope);
      } catch (funcError) {
        if (!(funcError instanceof NotDefinedIdentifierError)) throw funcError;
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
    const rawTarget = await this.target.execute(scope);
    const resolved = resolveMemberAccessTarget(rawTarget, this.tokens);

    const operatorNode = assignerToOperatorMap[
      this.operator as keyof typeof assignerToOperatorMap
    ];

    const operand = await this.value.execute(scope);
    let newValue = operand;

    if (operatorNode) {
      const oldValue = resolved.scope.getVariable(this.memberName);
      const tempOperator = new operatorNode(this.tokens);
      newValue = tempOperator.call(oldValue, operand);
    }

    resolved.scope.variables[this.memberName] = newValue;
  }

  override validate(scope: Scope): YaksokError[] {
    return [...this.target.validate(scope), ...this.value.validate(scope)];
  }

  override toPrint(): string {
    return `${this.target.toPrint()}.${this.memberName} ${this.operator} ...`;
  }
}
