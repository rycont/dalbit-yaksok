import { YaksokError } from '../error/common.ts'
import {
    AlreadyDefinedClassError,
    AlreadyDefinedMemberFunctionError,
    ConstructorArityAmbiguousError,
    ConstructorArityMismatchError,
    InvalidParentClassError,
    MemberFunctionNotFoundError,
    MemberNotFoundError,
    NotAClassError,
} from '../error/class.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'
import { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'
import type { RunnableObject } from '../value/function.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { ValueWithParenthesis } from './calculation.ts'
import { Block } from './block.ts'
import { DeclareFunction, evaluateParams, FunctionInvoke } from './function.ts'
import { assignerToOperatorMap } from './operator.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'
import {
    extractParamCountFromTokens,
    getDeclaredConstructorsInClass,
    isConstructorDeclaration,
    resolveConstructorByArity,
} from './class/constructor.ts'
import {
    ClassValue,
    resolveClassValueFromInstance,
} from './class/core.ts'
import {
    findMemberFunction,
    findVariableOwnerScopeInMemberChain,
    getMemberVariable,
    resolveMemberAccessTarget,
    setMemberVariable,
} from './class/member-runtime.ts'
import { hasExistingClassNameConflict } from './class/name-conflict.ts'
import { collectLikelyMemberNamesInClass } from './class/validation-analysis.ts'
import {
    createClassInstanceLayerScopes,
    createValidationInstanceFromClass,
} from './class/validation-instance.ts'

export { ClassValue, InstanceValue, SuperValue } from './class/core.ts'
export { createValidationInstanceFromClass } from './class/validation-instance.ts'

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
            const classValue = scope.getVariable(
                target.className,
                target.tokens,
            )
            if (classValue instanceof ClassValue) {
                return createValidationInstanceFromClass(
                    classValue,
                    target.arguments_.length,
                )
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

        const duplicatedMemberFunctionErrors =
            this.validateDuplicatedMemberFunctionName()
        if (duplicatedMemberFunctionErrors.length > 0) {
            throw duplicatedMemberFunctionErrors[0]
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
        validationErrors.push(...this.validateDuplicatedMemberFunctionName())
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
            if (!isConstructorDeclaration(child)) continue

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

    private validateDuplicatedMemberFunctionName(): YaksokError[] {
        const functionCountByName = new Map<string, number>()

        for (const child of this.body.children) {
            if (!(child instanceof DeclareFunction)) continue
            if (isConstructorDeclaration(child)) continue

            functionCountByName.set(
                child.name,
                (functionCountByName.get(child.name) ?? 0) + 1,
            )
        }

        const duplicatedNames = [...functionCountByName.entries()]
            .filter(([, count]) => count > 1)
            .map(([name]) => name)

        return duplicatedNames.map(
            (functionName) =>
                new AlreadyDefinedMemberFunctionError({
                    resource: {
                        className: this.name,
                        functionName,
                    },
                    tokens: this.tokens,
                }),
        )
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

    override async execute(scope: Scope) {
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

        for (const { klass, scope: layerScope } of layerScopes) {
            await klass.body.execute(layerScope)
        }
        instance.scope = finalScope

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

    private pickConstructorByArity(
        layerScopes: { klass: ClassValue; scope: Scope }[],
        arity: number,
        className: string,
    ): RunnableObject | undefined {
        const resolution = resolveConstructorByArity(
            layerScopes.map(({ klass }) => ({
                className: klass.name,
                arities: getDeclaredConstructorsInClass(klass).map(
                    (constructor) => constructor.arity,
                ),
            })),
            arity,
        )

        if (resolution.kind === 'ambiguous') {
            throw new ConstructorArityAmbiguousError({
                resource: {
                    className: resolution.className,
                    arity,
                },
                tokens: this.tokens,
            })
        }

        for (let i = layerScopes.length - 1; i >= 0; i--) {
            const { klass, scope } = layerScopes[i]
            const declaredConstructors = getDeclaredConstructorsInClass(klass)
            const matchingDeclaredConstructors = declaredConstructors.filter(
                (constructor) => constructor.arity === arity,
            )

            for (const constructor of matchingDeclaredConstructors) {
                const func = scope.functions.get(constructor.name)
                if (func) {
                    return func
                }
            }
        }

        if (resolution.kind === 'none') {
            return undefined
        }

        const expectedArities = resolution.kind === 'mismatch'
            ? resolution.expectedArities
            : [arity]
        throw new ConstructorArityMismatchError({
            resource: {
                className,
                expected: expectedArities,
                received: arity,
            },
            tokens: this.tokens,
        })
    }

    private validateConstructorByArity(
        classValue: ClassValue,
        arity: number,
    ): YaksokError[] {
        const resolution = resolveConstructorByArity(
            createClassChainConstructorLayers(classValue),
            arity,
        )
        if (
            resolution.kind === 'matched' ||
            resolution.kind === 'none' ||
            resolution.kind === 'ambiguous'
        ) {
            return []
        }

        return [
            new ConstructorArityMismatchError({
                resource: {
                    className: classValue.name,
                    expected: resolution.expectedArities,
                    received: arity,
                },
                tokens: this.tokens,
            }),
        ]
    }
}

function createClassChainConstructorLayers(classValue: ClassValue): {
    className: string
    arities: number[]
}[] {
    const layers: { className: string; arities: number[] }[] = []
    let cursor: ClassValue | undefined = classValue

    while (cursor) {
        layers.unshift({
            className: cursor.name,
            arities: getDeclaredConstructorsInClass(cursor).map(
                (constructor) => constructor.arity,
            ),
        })
        cursor = cursor.parentClass
    }

    return layers
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

        const args = await evaluateParams(this.invocation.params, scope)
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
        } catch (error) {
            if (!(error instanceof NotDefinedIdentifierError)) throw error

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

            const isInternalSelfOrSuperAccess =
                this.target instanceof Identifier &&
                (this.target.value === '자신' || this.target.value === '상위')
            if (isInternalSelfOrSuperAccess) {
                return targetErrors
            }

            const classValue = resolveClassValueFromInstance(
                scope,
                resolved.instance,
            )
            if (classValue) {
                const likelyMemberNames =
                    collectLikelyMemberNamesInClass(classValue)
                if (likelyMemberNames.has(this.memberName)) {
                    return targetErrors
                }
            }

            targetErrors.push(
                new MemberNotFoundError({
                    resource: {
                        className: resolved.instance.className,
                        memberName: this.memberName,
                    },
                    tokens: this.tokens,
                }),
            )
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
    public readonly __kind = 'SetMember' as const

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
