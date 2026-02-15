import { Scope } from '../executer/scope.ts'
import { ObjectValue, ValueType } from '../value/base.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { Block } from './block.ts'
import { ValueWithParenthesis } from './calculation.ts'
import { CountLoop } from './count-loop.ts'
import { DeclareFunction, evaluateParams, FunctionInvoke } from './function.ts'
import { IfStatement } from './IfStatement.ts'
import { ListLoop } from './listLoop.ts'
import { Loop } from './loop.ts'
import { type Token } from '../prepare/tokenize/token.ts'
import { FunctionObject, type RunnableObject } from '../value/function.ts'
import { YaksokError } from '../error/common.ts'
import {
    AlreadyDefinedClassError,
    ConstructorArityAmbiguousError,
    ConstructorArityMismatchError,
    DotAccessOnlyOnInstanceError,
    InvalidParentClassError,
    MemberFunctionNotFoundError,
    MemberNotFoundError,
    NotAClassError,
} from '../error/class.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'
import { assignerToOperatorMap } from './operator.ts'
import { extractParamNamesFromHeaderTokens } from '../util/extract-param-names-from-header-tokens.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'

type MemberAccessTarget = InstanceValue | SuperValue

const CONSTRUCTOR_NAME_PATTERN = /^__준비__(?:\s*\([^)]*\))?$/

function resolveMemberAccessTarget(
    target: ValueType,
    tokens: Token[],
): { scope: Scope; instance: InstanceValue } {
    if (target instanceof InstanceValue) {
        return {
            scope: target.scope,
            instance: target,
        }
    }

    if (target instanceof SuperValue) {
        return {
            scope: target.scope,
            instance: target.instance,
        }
    }

    throw new DotAccessOnlyOnInstanceError({
        tokens,
    })
}

function findMemberFunction(
    scope: Scope,
    instance: InstanceValue,
    functionName: string,
): RunnableObject | undefined {
    let cursor: Scope | undefined = scope
    while (cursor) {
        const fromCurrentScope = cursor.functions.get(functionName)
        if (fromCurrentScope) {
            return fromCurrentScope
        }
        if (cursor === instance.memberLookupRootScope) {
            break
        }
        cursor = cursor.parent
    }

    return undefined
}

function findVariableOwnerScopeInMemberChain(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
): Scope | undefined {
    let cursor: Scope | undefined = scope
    while (cursor) {
        if (memberName in cursor.variables) {
            return cursor
        }
        if (cursor === instance.memberLookupRootScope) {
            break
        }
        cursor = cursor.parent
    }

    return undefined
}

function getMemberVariable(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
    tokens: Token[],
): ValueType {
    const owner = findVariableOwnerScopeInMemberChain(
        scope,
        instance,
        memberName,
    )
    if (!owner) {
        const error = new NotDefinedIdentifierError({
            resource: {
                name: memberName,
            },
        })
        error.tokens = tokens
        throw error
    }
    return owner.getVariable(memberName, tokens)
}

function setMemberVariable(
    scope: Scope,
    instance: InstanceValue,
    memberName: string,
    value: ValueType,
    tokens: Token[],
): void {
    const owner = findVariableOwnerScopeInMemberChain(
        scope,
        instance,
        memberName,
    )
    if (owner) {
        owner.setLocalVariable(memberName, value, tokens)
        return
    }

    scope.setLocalVariable(memberName, value, tokens)
}

function resolveClassValueFromInstance(
    scope: Scope,
    instance: InstanceValue,
): ClassValue | undefined {
    if (instance.classValue) {
        return instance.classValue
    }

    try {
        const value = scope.getVariable(instance.className)
        if (value instanceof ClassValue) {
            return value
        }
        return undefined
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}

function collectPotentialMemberNamesInClass(
    classValue: ClassValue,
): Set<string> {
    const names = new Set<string>()

    const isSetVariableNode = (
        node: unknown,
    ): node is { name: string } => {
        return (
            node instanceof Evaluable &&
            'name' in node &&
            typeof (node as { name?: unknown }).name === 'string' &&
            'operator' in node &&
            typeof (node as { operator?: unknown }).operator === 'string' &&
            'value' in node
        )
    }

    const isSetMemberOnSelfNode = (
        node: unknown,
    ): node is SetMember => {
        return (
            node instanceof SetMember &&
            node.target instanceof Identifier &&
            node.target.value === '자신'
        )
    }

    const collectInNode = (node: unknown, inFunctionScope = false) => {
        if (!inFunctionScope && isSetVariableNode(node)) {
            names.add(node.name)
        }

        if (isSetMemberOnSelfNode(node)) {
            names.add(node.memberName)
        }

        if (node instanceof DeclareFunction) {
            collectInBlock(node.body, true)
            return
        }

        if (node instanceof Block) {
            collectInBlock(node, inFunctionScope)
            return
        }

        if (node instanceof IfStatement) {
            for (const caseItem of node.cases) {
                collectInBlock(caseItem.body, inFunctionScope)
            }
            return
        }

        if (
            node instanceof Loop ||
            node instanceof CountLoop ||
            node instanceof ListLoop
        ) {
            collectInBlock(node.body, inFunctionScope)
        }
    }

    const collectInBlock = (block: Block, inFunctionScope = false) => {
        for (const child of block.children) {
            collectInNode(child, inFunctionScope)
        }
    }

    for (const klass of getInheritanceChain(classValue)) {
        collectInBlock(klass.body)
    }

    return names
}

function isConstructorFunctionName(name: string): boolean {
    return CONSTRUCTOR_NAME_PATTERN.test(name)
}

function getDeclaredConstructorsInClass(klass: ClassValue): {
    arity: number
}[] {
    const constructors: { arity: number }[] = []

    for (const child of klass.body.children) {
        if (!(child instanceof DeclareFunction)) continue
        if (!isConstructorFunctionName(child.name)) continue
        constructors.push({
            arity: extractParamCountFromTokens(child.tokens),
        })
    }

    return constructors
}

function extractParamCountFromTokens(allTokens: Token[]): number {
    return extractParamNamesFromHeaderTokens(allTokens).length
}

function getInheritanceChain(classValue: ClassValue): ClassValue[] {
    const chain: ClassValue[] = []
    let cursor: ClassValue | undefined = classValue

    while (cursor) {
        chain.unshift(cursor)
        cursor = cursor.parentClass
    }

    return chain
}

function resolveExistingIdentifierValue(
    scope: Scope,
    name: string,
): ValueType | undefined {
    try {
        return scope.getVariable(name)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}

function resolveExistingFunctionObject(
    scope: Scope,
    name: string,
): RunnableObject | undefined {
    try {
        return scope.getFunctionObject(name)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            return undefined
        }
        throw error
    }
}

function hasExistingClassNameConflict(scope: Scope, name: string): boolean {
    return (
        resolveExistingIdentifierValue(scope, name) !== undefined ||
        resolveExistingFunctionObject(scope, name) !== undefined
    )
}

function createClassInstanceLayerScopes(classValue: ClassValue): {
    instance: InstanceValue
    layerScopes: { klass: ClassValue; scope: Scope }[]
    finalScope: Scope
} {
    const rootScope = new Scope({
        parent: classValue.definitionScope,
        allowFunctionOverride: true,
    })

    const instance = new InstanceValue(classValue.name)
    instance.classValue = classValue
    instance.memberLookupRootScope = rootScope

    let currentScope = rootScope
    const layerScopes: { klass: ClassValue; scope: Scope }[] = []

    for (const klass of getInheritanceChain(classValue)) {
        const layerScope = new Scope({
            parent: currentScope,
            allowFunctionOverride: true,
        })

        layerScope.setLocalVariable('자신', instance)
        if (klass.parentClass) {
            layerScope.setLocalVariable(
                '상위',
                new SuperValue(instance, currentScope),
            )
        }

        layerScopes.push({
            klass,
            scope: layerScope,
        })
        currentScope = layerScope
    }

    return {
        instance,
        layerScopes,
        finalScope: currentScope,
    }
}

function resolveValidationTargetValue(
    target: Evaluable,
    scope: Scope,
): ValueType | undefined {
    if (target instanceof Identifier) {
        try {
            return scope.getVariable(target.value)
        } catch (error) {
            if (error instanceof NotDefinedIdentifierError) {
                return undefined
            }
            throw error
        }
    }

    if (target instanceof NewInstance) {
        try {
            const classValue = scope.getVariable(target.className, target.tokens)
            if (classValue instanceof ClassValue) {
                return createValidationInstanceFromClass(classValue)
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                return undefined
            }
            throw error
        }
    }

    if (target instanceof ValueWithParenthesis) {
        return resolveValidationTargetValue(target.value, scope)
    }

    if (target instanceof FetchMember) {
        const rawTarget = resolveValidationTargetValue(target.target, scope)
        if (!rawTarget) {
            return undefined
        }

        const resolved = resolveMemberAccessTarget(rawTarget, target.tokens)
        try {
            return getMemberVariable(
                resolved.scope,
                resolved.instance,
                target.memberName,
                target.tokens,
            )
        } catch (error) {
            if (error instanceof YaksokError) {
                return undefined
            }
            throw error
        }
    }

    return undefined
}

export function createValidationInstanceFromClass(
    classValue: ClassValue,
): InstanceValue {
    const { instance, layerScopes, finalScope } =
        createClassInstanceLayerScopes(classValue)

    for (const { klass, scope } of layerScopes) {
        for (const child of klass.body.children) {
            if (!(child instanceof DeclareFunction)) continue

            const paramNames =
                child.paramNames ??
                extractParamNamesFromHeaderTokens(child.tokens)
            scope.addFunctionObject(
                new FunctionObject(
                    child.name,
                    child.body,
                    scope,
                    paramNames,
                ),
            )
        }
    }

    instance.scope = finalScope
    return instance
}

export class DeclareClass extends Executable {
    static override friendlyName = '클래스 선언'

    constructor(
        public name: string,
        public body: Block,
        public override tokens: Token[],
        public parentName?: string,
    ) {
        super()
        const nameToken =
            this.tokens.find((token) => token.value === this.name) ||
            this.tokens[0]
        if (nameToken) {
            assertValidIdentifierName(this.name, nameToken)
        }
    }

    override execute(scope: Scope): Promise<void> {
        if (hasExistingClassNameConflict(scope, this.name)) {
            throw new AlreadyDefinedClassError({
                resource: {
                    name: this.name,
                },
                tokens: this.tokens,
            })
        }

        const parentClass = this.resolveParentClass(scope)
        const classValue = new ClassValue(
            this.name,
            this.body,
            scope,
            parentClass,
        )
        scope.setVariable(this.name, classValue)
        return Promise.resolve()
    }

    override validate(scope: Scope): YaksokError[] {
        if (hasExistingClassNameConflict(scope, this.name)) {
            return [
                new AlreadyDefinedClassError({
                    resource: {
                        name: this.name,
                    },
                    tokens: this.tokens,
                }),
            ]
        }

        let parentClass: ClassValue | undefined
        try {
            parentClass = this.resolveParentClass(scope)
        } catch (error) {
            if (error instanceof YaksokError) {
                if (!error.tokens) {
                    error.tokens = this.tokens
                }
                return [error]
            }
            throw error
        }

        const dummyClass = new ClassValue(
            this.name,
            this.body,
            scope,
            parentClass,
        )
        scope.setVariable(this.name, dummyClass)

        const dummyInstance = createValidationInstanceFromClass(dummyClass)
        const validationErrors = this.body.validate(dummyInstance.scope)
        validationErrors.push(...this.validateDuplicatedConstructorArity())
        return validationErrors
    }

    private resolveParentClass(scope: Scope): ClassValue | undefined {
        if (!this.parentName) {
            return undefined
        }

        const parentValue = scope.getVariable(this.parentName)
        if (!(parentValue instanceof ClassValue)) {
            throw new InvalidParentClassError({
                resource: {
                    name: this.parentName,
                },
                tokens: this.tokens,
            })
        }

        return parentValue
    }

    override toPrint(): string {
        return `클래스 ${this.name}`
    }

    private validateDuplicatedConstructorArity(): YaksokError[] {
        const constructorCountByArity = new Map<number, number>()

        for (const child of this.body.children) {
            if (!(child instanceof DeclareFunction)) continue
            if (!isConstructorFunctionName(child.name)) continue
            const arity = extractParamCountFromTokens(child.tokens)
            constructorCountByArity.set(
                arity,
                (constructorCountByArity.get(arity) ?? 0) + 1,
            )
        }

        const duplicatedArities = [...constructorCountByArity.entries()]
            .filter(([, count]) => count > 1)
            .map(([arity]) => arity)

        return duplicatedArities.map(
            (arity) =>
                new ConstructorArityAmbiguousError({
                    resource: {
                        className: this.name,
                        arity,
                    },
                    tokens: this.tokens,
                }),
        )
    }
}

export class ClassValue extends ValueType {
    static override friendlyName = '클래스'

    constructor(
        public name: string,
        public body: Block,
        public definitionScope: Scope,
        public parentClass?: ClassValue,
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
            throw new NotAClassError({
                resource: {
                    className: this.className,
                },
                tokens: this.tokens,
            })
        }

        const { instance, layerScopes, finalScope } =
            createClassInstanceLayerScopes(classValue)

        // 부모 -> 자식 순으로 바디를 실행해 상속 체인을 구성합니다.
        for (const { klass, scope: layerScope } of layerScopes) {
            await klass.body.execute(layerScope)
        }
        instance.scope = finalScope

        // Call __준비__ (constructor) if it exists
        const initFunc = this.pickConstructorByArity(
            layerScopes,
            this.arguments_.length,
            classValue.name,
        )

        if (initFunc) {
            const args: Record<string, ValueType> = {}

            for (let i = 0; i < initFunc.paramNames.length; i++) {
                const paramName = initFunc.paramNames[i]
                if (i < this.arguments_.length) {
                    args[paramName] = await this.arguments_[i].execute(scope)
                }
            }

            await initFunc.run(args, instance.scope)
        }
        // If no __준비__, args are silently ignored

        return instance
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.arguments_.flatMap((arg) => arg.validate(scope))

        try {
            const classValue = scope.getVariable(this.className, this.tokens)
            if (!(classValue instanceof ClassValue)) {
                errors.push(
                    new NotAClassError({
                        resource: {
                            className: this.className,
                        },
                        tokens: this.tokens,
                    }),
                )
            } else {
                errors.push(
                    ...this.validateConstructorByArity(
                        classValue,
                        this.arguments_.length,
                    ),
                )
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                if (!error.tokens) {
                    error.tokens = this.tokens
                }
                errors.push(error)
            } else {
                throw error
            }
        }

        return errors
    }

    override toPrint(): string {
        return `새 ${this.className}`
    }

    private getInheritanceChain(classValue: ClassValue): ClassValue[] {
        return getInheritanceChain(classValue)
    }

    private pickConstructorByArity(
        layerScopes: { klass: ClassValue; scope: Scope }[],
        arity: number,
        className: string,
    ): RunnableObject | undefined {
        const expectedArities = new Set<number>()

        for (let i = layerScopes.length - 1; i >= 0; i--) {
            const { klass, scope } = layerScopes[i]
            const matchingCandidates: RunnableObject[] = []
            const declaredConstructors = getDeclaredConstructorsInClass(klass)

            for (const constructor of declaredConstructors) {
                expectedArities.add(constructor.arity)
            }

            const matchingDeclaredConstructors = declaredConstructors.filter(
                (constructor) => constructor.arity === arity,
            )
            if (matchingDeclaredConstructors.length > 1) {
                throw new ConstructorArityAmbiguousError({
                    resource: {
                        className: klass.name,
                        arity,
                    },
                    tokens: this.tokens,
                })
            }

            for (const [name, func] of scope.functions) {
                if (!isConstructorFunctionName(name)) continue
                if (func.paramNames.length === arity) {
                    matchingCandidates.push(func)
                }
            }

            if (matchingCandidates.length > 1) {
                throw new ConstructorArityAmbiguousError({
                    resource: {
                        className: klass.name,
                        arity,
                    },
                    tokens: this.tokens,
                })
            }

            if (matchingCandidates.length === 1) {
                return matchingCandidates[0]
            }
        }

        if (expectedArities.size === 0) {
            return undefined
        }

        const sortedExpectedArities = [...expectedArities].sort((a, b) => a - b)
        throw new ConstructorArityMismatchError({
            resource: {
                className,
                expected: sortedExpectedArities,
                received: arity,
            },
            tokens: this.tokens,
        })
    }

    private validateConstructorByArity(
        classValue: ClassValue,
        arity: number,
    ): YaksokError[] {
        const expectedArities = new Set<number>()
        let hasDuplicatedArityInLayer = false
        const chain = this.getInheritanceChain(classValue)

        for (let i = chain.length - 1; i >= 0; i--) {
            const klass = chain[i]
            const constructors = getDeclaredConstructorsInClass(klass)
            const matchingCandidates = constructors.filter(
                (constructor) => constructor.arity === arity,
            )
            if (matchingCandidates.length > 1) {
                hasDuplicatedArityInLayer = true
            }

            for (const constructor of constructors) {
                expectedArities.add(constructor.arity)
            }

            if (matchingCandidates.length === 1) {
                return []
            }
        }

        if (expectedArities.size === 0) {
            return []
        }
        if (hasDuplicatedArityInLayer) {
            // Duplicate arity ambiguity is already reported at class declaration validation.
            return []
        }

        return [
            new ConstructorArityMismatchError({
                resource: {
                    className: classValue.name,
                    expected: [...expectedArities].sort((a, b) => a - b),
                    received: arity,
                },
                tokens: this.tokens,
            }),
        ]
    }
}

export class InstanceValue extends ObjectValue {
    static override friendlyName = '인스턴스'

    /** 상속 체인 실행 후 NewInstance에서 할당됩니다. */
    public scope!: Scope
    /** 멤버 메서드 탐색은 이 스코프까지 허용됩니다. */
    public memberLookupRootScope!: Scope
    /** 선언 시점 클래스 심볼이 가려져도 validation에서 클래스 메타를 참조하기 위한 원본입니다. */
    public classValue?: ClassValue

    constructor(public className: string) {
        super()
    }

    override toPrint(): string {
        return `<${this.className} 인스턴스>`
    }
}

export class SuperValue extends ObjectValue {
    static override friendlyName = '상위'

    constructor(
        public instance: InstanceValue,
        public scope: Scope,
    ) {
        super()
    }

    override toPrint(): string {
        return '<상위>'
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
        const rawTarget = await this.target.execute(scope)
        const resolved = resolveMemberAccessTarget(rawTarget, this.tokens)
        resolved.scope.setVariable('자신', resolved.instance, this.tokens)

        const memberFunction = findMemberFunction(
            resolved.scope,
            resolved.instance,
            this.invocation.name,
        )
        if (!memberFunction) {
            throw new MemberFunctionNotFoundError({
                resource: {
                    className: resolved.instance.className,
                    functionName: this.invocation.name,
                },
                tokens: this.tokens,
            })
        }

        const args = await evaluateParams(
            this.invocation.params,
            scope,
        )
        return await memberFunction.run(args, resolved.scope)
    }

    override validate(scope: Scope): YaksokError[] {
        const targetErrors = this.target.validate(scope)
        const paramErrors = Object.values(this.invocation.params).flatMap(
            (param) => param.validate(scope),
        )
        const allErrors = [...targetErrors, ...paramErrors]
        if (allErrors.length > 0) {
            return allErrors
        }

        try {
            const rawTarget = resolveValidationTargetValue(this.target, scope)
            if (rawTarget) {
                const resolved = resolveMemberAccessTarget(
                    rawTarget,
                    this.tokens,
                )
                const memberFunction = findMemberFunction(
                    resolved.scope,
                    resolved.instance,
                    this.invocation.name,
                )
                if (!memberFunction) {
                    allErrors.push(
                        new MemberFunctionNotFoundError({
                            resource: {
                                className: resolved.instance.className,
                                functionName: this.invocation.name,
                            },
                            tokens: this.tokens,
                        }),
                    )
                }
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                allErrors.push(error)
            } else {
                throw error
            }
        }

        return allErrors
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
        const rawTarget = await this.target.execute(scope)
        const resolved = resolveMemberAccessTarget(rawTarget, this.tokens)

        try {
            return getMemberVariable(
                resolved.scope,
                resolved.instance,
                this.memberName,
                this.tokens,
            )
        } catch (e) {
            if (!(e instanceof NotDefinedIdentifierError)) throw e

            // Variable not found — fall back to no-arg method invocation
            const func = findMemberFunction(
                resolved.scope,
                resolved.instance,
                this.memberName,
            )
            if (!func) {
                throw new MemberNotFoundError({
                    resource: {
                        className: resolved.instance.className,
                        memberName: this.memberName,
                    },
                    tokens: this.tokens,
                })
            }
            resolved.scope.setVariable('자신', resolved.instance, this.tokens)
            return await func.run({}, resolved.scope)
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const targetErrors = this.target.validate(scope)
        if (targetErrors.length > 0) {
            return targetErrors
        }

        try {
            const rawTarget = resolveValidationTargetValue(this.target, scope)
            if (!rawTarget) {
                return targetErrors
            }
            const resolved = resolveMemberAccessTarget(rawTarget, this.tokens)

            const owner = findVariableOwnerScopeInMemberChain(
                resolved.scope,
                resolved.instance,
                this.memberName,
            )

            if (owner) {
                return targetErrors
            }

            const func = findMemberFunction(
                resolved.scope,
                resolved.instance,
                this.memberName,
            )

            if (func) {
                return targetErrors
            }

            const classValue = resolveClassValueFromInstance(
                scope,
                resolved.instance,
            )
            if (!classValue) {
                return targetErrors
            }

            const possibleMemberNames =
                collectPotentialMemberNamesInClass(classValue)
            if (!possibleMemberNames.has(this.memberName)) {
                targetErrors.push(
                    new MemberNotFoundError({
                        resource: {
                            className: resolved.instance.className,
                            memberName: this.memberName,
                        },
                        tokens: this.tokens,
                    }),
                )
            }
        } catch (error) {
            if (error instanceof YaksokError) {
                targetErrors.push(error)
            } else {
                throw error
            }
        }

        return targetErrors
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
        const rawTarget = await this.target.execute(scope)
        const resolved = resolveMemberAccessTarget(rawTarget, this.tokens)

        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.value.execute(scope)
        let newValue = operand

        if (operatorNode) {
            const oldValue = getMemberVariable(
                resolved.scope,
                resolved.instance,
                this.memberName,
                this.tokens,
            )
            const tempOperator = new operatorNode(this.tokens)
            newValue = tempOperator.call(oldValue, operand)
        }

        setMemberVariable(
            resolved.scope,
            resolved.instance,
            this.memberName,
            newValue,
            this.tokens,
        )
    }

    override validate(scope: Scope): YaksokError[] {
        return [...this.target.validate(scope), ...this.value.validate(scope)]
    }

    override toPrint(): string {
        return `${this.target.toPrint()}.${this.memberName} ${this.operator} ...`
    }
}
