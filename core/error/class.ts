import { blue, bold, YaksokError } from './common.ts'
import type { Token } from '../prepare/tokenize/token.ts'

interface InvalidParentClassErrorResource {
    name: string
}

interface AlreadyDefinedClassErrorResource {
    name: string
}

export class AlreadyDefinedClassError extends YaksokError<AlreadyDefinedClassErrorResource> {
    constructor(props: {
        resource: AlreadyDefinedClassErrorResource
        tokens?: Token[]
    }) {
        super(props)
        this.message = `${bold(
            blue(props.resource.name),
        )} 클래스는 이미 정의되어 있습니다.`
    }
}

export class InvalidParentClassError extends YaksokError<InvalidParentClassErrorResource> {
    constructor(props: {
        resource: InvalidParentClassErrorResource
        tokens?: Token[]
    }) {
        super(props)
        this.message = `${bold(
            blue(props.resource.name),
        )}은(는) 부모 클래스로 쓸 수 없습니다.`
    }
}

interface NotAClassErrorResource {
    className: string
}

export class NotAClassError extends YaksokError<NotAClassErrorResource> {
    constructor(props: { resource: NotAClassErrorResource; tokens?: Token[] }) {
        super(props)
        this.message = `${bold(
            blue(props.resource.className),
        )}은(는) 클래스가 아닙니다.`
    }
}

export class DotAccessOnlyOnInstanceError extends YaksokError {
    constructor(props: { tokens?: Token[] }) {
        super(props)
        this.message = '온점(.)은 인스턴스에만 사용할 수 있습니다.'
    }
}

interface ConstructorArityMismatchErrorResource {
    className: string
    expected: number[]
    received: number
}

export class ConstructorArityMismatchError extends YaksokError<ConstructorArityMismatchErrorResource> {
    constructor(props: {
        resource: ConstructorArityMismatchErrorResource
        tokens?: Token[]
    }) {
        super(props)
        const { className, expected, received } = props.resource
        const expectedStr =
            expected.length === 1
                ? `${expected[0]}개`
                : `${expected.slice(0, -1).join(', ')} 또는 ${expected.at(-1)}개`
        this.message = `${bold(
            blue(className),
        )}의 __준비__에 인자 ${received}개를 넘겼지만, 정의된 생성자는 ${expectedStr} 인자를 받습니다.`
    }
}

interface ConstructorArityAmbiguousErrorResource {
    className: string
    arity: number
}

export class ConstructorArityAmbiguousError extends YaksokError<ConstructorArityAmbiguousErrorResource> {
    constructor(props: {
        resource: ConstructorArityAmbiguousErrorResource
        tokens?: Token[]
    }) {
        super(props)
        const { className, arity } = props.resource
        this.message = `${bold(
            blue(className),
        )}의 __준비__에 인자 ${arity}개 생성자가 여러 개 있어 모호합니다.`
    }
}

interface MemberFunctionNotFoundErrorResource {
    className: string
    functionName: string
}

export class MemberFunctionNotFoundError extends YaksokError<MemberFunctionNotFoundErrorResource> {
    constructor(props: {
        resource: MemberFunctionNotFoundErrorResource
        tokens?: Token[]
    }) {
        super(props)
        const { className, functionName } = props.resource
        this.message = `${bold(blue(className))} 인스턴스에서 ${bold(
            blue(functionName),
        )} 메서드를 찾을 수 없습니다.`
    }
}

interface MemberNotFoundErrorResource {
    className: string
    memberName: string
}

export class MemberNotFoundError extends YaksokError<MemberNotFoundErrorResource> {
    constructor(props: {
        resource: MemberNotFoundErrorResource
        tokens?: Token[]
    }) {
        super(props)
        const { className, memberName } = props.resource
        this.message = `${bold(blue(className))} 인스턴스에서 ${bold(
            blue(memberName),
        )} 멤버를 찾을 수 없습니다.`
    }
}

interface AlreadyDefinedMemberFunctionErrorResource {
    className: string
    functionName: string
}

export class AlreadyDefinedMemberFunctionError extends YaksokError<AlreadyDefinedMemberFunctionErrorResource> {
    constructor(props: {
        resource: AlreadyDefinedMemberFunctionErrorResource
        tokens?: Token[]
    }) {
        super(props)
        const { className, functionName } = props.resource
        this.message = `${bold(blue(className))} 클래스의 ${bold(
            blue(functionName),
        )} 메서드는 이미 정의되어 있습니다.`
    }
}
