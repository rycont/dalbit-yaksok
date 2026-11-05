import { YaksokError, Scope, Node } from '@dalbit-yaksok/core'

export class MissingFunctionBody extends YaksokError {
    constructor(props: { node: Node; scope: Scope }) {
        super(props)
    }

    override message =
        '약속에는 내용이 필요해요. 이름의 다음 줄에 띄어쓰기 네개로 들여쓰고 내용을 작성해주세요.'
}
