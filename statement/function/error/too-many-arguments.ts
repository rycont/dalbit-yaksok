import { Token, YaksokError, blue, bold } from '@dalbit-yaksok/core'

export class TooManyArgumentsError extends YaksokError<{
    expectedMax: number
    given: number
}> {
    constructor(props: {
        resource: {
            expectedMax: number
            given: number
        }
        tokens: Token[]
    }) {
        super(props)

        this.message = `주어진 값이 너무 많아요. ${bold(
            blue(props.resource.expectedMax) + '개',
        )} 까지만 받을 수 있는데 ${bold(
            blue(props.resource.given) + '개',
        )}나 들어왔어요.`
    }
}
