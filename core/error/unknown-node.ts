import { Node } from '../node/base.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { blue, bold, YaksokError } from './common.ts'

export class UnknownNodeError extends YaksokError {
    constructor(props: { tokens: Token[] }) {
        super(props)

        this.message = '올바르지 않은 코드에요. 문법을 다시 확인해주세요.'
    }
}

export class NotExecutableNodeError extends YaksokError {
    constructor(props: {
        tokens: Token[]
        resource: { node: Node; message?: string }
    }) {
        super(props)

        if (props.resource.message) {
            this.message = props.resource.message
        } else {
            this.message = `${bold(
                blue(
                    (props.resource.node.constructor as typeof Node)
                        .friendlyName,
                ),
            )}는 실행할 수 없는 코드에요.`
        }
    }
}

export class IncompleteMentionError extends YaksokError {
    constructor(props: {
        tokens: Token[]
        resource: { node: Node; message?: string }
    }) {
        super(props)

        this.message = `${blue(
            bold('@' + props.resource.node.value),
        )}은 실행할 수 없어요. 이 뒤에 불러올 변수나 함수 이름을 적어주세요.`
    }
}
