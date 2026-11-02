import {
    Position,
    Token,
    ValueType,
    valueTypeToText,
    YaksokError,
} from '@dalbit-yaksok/core'

export class InvalidTypeCastError extends YaksokError {
    constructor(props: {
        position?: Position
        tokens?: Token[]
        resource: {
            value: ValueType
            targetType: string
        }
    }) {
        super(props)

        const valueText = valueTypeToText(props.resource.value)
        this.message = `${valueText}을(를) ${props.resource.targetType}(으)로 바꿀 수 없어요.`
    }
}
