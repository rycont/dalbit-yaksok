import { YaksokError } from '../error/common.ts'
import {
    AlreadyDefinedClassError,
    InvalidParentClassError,
    MemberFunctionNotFoundError,
    MemberNotFoundError,
    NotAClassError,
} from '../error/class.ts'
import { NotDefinedIdentifierError } from '../error/variable.ts'
import { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { ValueWithParenthesis } from './calculation.ts'
import { Block } from './block.ts'
import { evaluateParams, FunctionInvoke } from './function.ts'
import { assignerToOperatorMap } from './operator.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'
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
import {
    validateDuplicatedConstructorArity,
    validateDuplicatedMemberFunctionName,
} from './class/declare-validation.ts'
import {
    pickConstructorByArity,
    validateConstructorByArity,
} from './class/new-instance-constructor.ts'

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
            validateDuplicatedMemberFunctionName(
                this.name,
                this.body.children,
                this.tokens,
            )
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
        validationErrors.push(
            ...validateDuplicatedConstructorArity(
                this.name,
                dummyClass,
                this.tokens,
            ),
        )
        validationErrors.push(
            ...validateDuplicatedMemberFunctionName(
                this.name,
                this.body.children,
                this.tokens,
            ),
        )
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

        const initFunc = pickConstructorByArity({
            layerScopes,
            arity: this.arguments_.length,
            className: classValue.name,
            tokens: this.tokens,
        })

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
                    ...validateConstructorByArity(
                        classValue,
                        this.arguments_.length,
                        this.tokens,
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
