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
import { IndexedValue } from '../value/indexed.ts'
import { ListValue } from '../value/list.ts'
import { BooleanValue, NumberValue, StringValue } from '../value/primitive.ts'
import { TupleValue } from '../value/tuple.ts'
import { Evaluable, Executable, Identifier } from './base.ts'
import { ValueWithParenthesis } from './calculation.ts'
import { Block } from './block.ts'
import { evaluateParams, FunctionInvoke } from './function.ts'
import { assignerToOperatorMap } from './operator.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'
import {
    ClassValue,
    InstanceValue,
    SuperValue,
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
import { FunctionObject } from '../value/function.ts'
import { FFIObject } from '../value/ffi.ts'

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

function isDotMethodReceiverTypeMatch(
    value: ValueType,
    receiverTypeNames: string[],
): boolean {
    const normalized = receiverTypeNames.map((name) => name.trim())
    if (normalized.length === 0) return true

    return normalized.some((typeName) => {
        if (typeName === '문자' || typeName === '문자열') {
            return value instanceof StringValue
        }
        if (typeName === '리스트' || typeName === '목록' || typeName === '배열') {
            return value instanceof ListValue
        }
        if (typeName === '딕셔너리' || typeName === '사전') {
            return value instanceof IndexedValue && !(value instanceof ListValue)
        }
        if (typeName === '숫자') {
            return value instanceof NumberValue
        }
        if (typeName === '불리언' || typeName === '논리' || typeName === '참거짓') {
            return value instanceof BooleanValue
        }
        if (typeName === '튜플') {
            return value instanceof TupleValue
        }

        return false
    })
}

function findFunctionOwnerScope(scope: Scope, name: string): Scope | undefined {
    let cursor: Scope | undefined = scope
    while (cursor) {
        if (cursor.functions.has(name)) {
            return cursor
        }
        cursor = cursor.parent
    }

    return undefined
}

function getRuntimeValueTypeName(value: ValueType): string {
    return (value.constructor as typeof ValueType).friendlyName
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

    override async execute(scope: Scope): Promise<ValueType> {
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
        const args = await evaluateParams(this.invocation.params, scope)
        if (rawTarget instanceof InstanceValue || rawTarget instanceof SuperValue) {
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

            return await memberFunction.run(args, resolved.scope)
        }

        const functionOwner = findFunctionOwnerScope(scope, this.invocation.name)
        if (!functionOwner) {
            return await this.invocation.execute(scope, args)
        }

        const functionObject = functionOwner.functions.get(this.invocation.name)
        if (
            !(functionObject instanceof FunctionObject) &&
            !(functionObject instanceof FFIObject)
        ) {
            return await this.invocation.execute(scope, args)
        }

        const dotReceiverTypeNames = functionObject.options.dotReceiverTypeNames
        if (!dotReceiverTypeNames) {
            throw new MemberFunctionNotFoundError({
                resource: {
                    className: getRuntimeValueTypeName(rawTarget),
                    functionName: this.invocation.name,
                },
                tokens: this.tokens,
            })
        }
        if (!isDotMethodReceiverTypeMatch(rawTarget, dotReceiverTypeNames)) {
            throw new MemberFunctionNotFoundError({
                resource: {
                    className: getRuntimeValueTypeName(rawTarget),
                    functionName: this.invocation.name,
                },
                tokens: this.tokens,
            })
        }

        const hasExistingSelf =
            Object.prototype.hasOwnProperty.call(functionOwner.variables, '자신')
        const previousSelf = functionOwner.variables['자신']

        functionOwner.setLocalVariable('자신', rawTarget, this.tokens)
        try {
            if (functionObject instanceof FFIObject) {
                return await functionObject.run(
                    {
                        ...args,
                        자신: rawTarget,
                    },
                    scope,
                )
            }
            return await this.invocation.execute(scope, args)
        } finally {
            if (hasExistingSelf) {
                functionOwner.setLocalVariable('자신', previousSelf, this.tokens)
            } else {
                delete functionOwner.variables['자신']
            }
        }
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
                if (
                    !(rawTarget instanceof InstanceValue) &&
                    !(rawTarget instanceof SuperValue)
                ) {
                    return allErrors
                }

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
        
        if (rawTarget instanceof InstanceValue || rawTarget instanceof SuperValue) {
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

        // 일반 ValueType에 대한 메소드 호출(인자 없음) 지원
        const functionOwner = findFunctionOwnerScope(scope, this.memberName)
        if (functionOwner) {
            const functionObject = functionOwner.functions.get(this.memberName)
            if (
                (functionObject instanceof FunctionObject || functionObject instanceof FFIObject) &&
                functionObject.options.dotReceiverTypeNames &&
                isDotMethodReceiverTypeMatch(rawTarget, functionObject.options.dotReceiverTypeNames)
            ) {
                const hasExistingSelf = Object.prototype.hasOwnProperty.call(functionOwner.variables, '자신')
                const previousSelf = functionOwner.variables['자신']

                functionOwner.setLocalVariable('자신', rawTarget, this.tokens)
                try {
                    if (functionObject instanceof FFIObject) {
                        return await functionObject.run({ 자신: rawTarget }, scope)
                    }
                    return await functionObject.run({}, scope)
                } finally {
                    if (hasExistingSelf) {
                        functionOwner.setLocalVariable('자신', previousSelf, this.tokens)
                    } else {
                        delete functionOwner.variables['자신']
                    }
                }
            }
        }

        // 만약 인스턴스가 아니면 resolveMemberAccessTarget이 에러를 던짐
        const resolved = resolveMemberAccessTarget(rawTarget, this.tokens)
        return getMemberVariable(resolved.scope, resolved.instance, this.memberName, this.tokens)
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

            if (!(rawTarget instanceof InstanceValue) && !(rawTarget instanceof SuperValue)) {
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
