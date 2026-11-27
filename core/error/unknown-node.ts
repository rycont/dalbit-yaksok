import { Scope, Token, YaksokError, type Node } from '@dalbit-yaksok/core'

export class MentionRequiresRunFrame extends YaksokError {
    constructor(props: { tokens: Token[]; node: Node; scope: Scope }) {
        super(props)

        this.message = `불러올 파일이 아직 실행되지 않았어요.`
    }
}
