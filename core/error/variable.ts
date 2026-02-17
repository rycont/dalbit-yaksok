import { blue, bold, YaksokError } from './common.ts'
import { RESERVED_WORDS } from '../constant/reserved-words.ts'

export class NotProperIdentifierNameToDefineError extends YaksokError<{
    texts: string[]
}> {
    constructor(props: { texts: string[] }) {
        super({
            resource: props,
        })

        const matchedReservedWords = [...RESERVED_WORDS].filter((word) =>
            props.texts.includes(word),
        )

        if (matchedReservedWords.length) {
            this.message = `${bold(
                blue(props.texts.join(' ').trim()),
            )}에서 ${matchedReservedWords
                .map((e) => `'${e}'`)
                .map(bold)
                .map(blue)
                .join(', ')}는 변수나 약속의 이름으로 사용할 수 없어요.`
            return
        }

        this.message = `${bold(
            blue(props.texts.join(' ')),
        )}는 변수나 약속의 이름으로 사용할 수 없어요.`
    }
}

interface NotDefinedIdentifierErrorResource {
    name: string
    suggestedFix?: string
}

export class NotDefinedIdentifierError extends YaksokError<NotDefinedIdentifierErrorResource> {
    constructor(props: {
        resource: NotDefinedIdentifierErrorResource
        texts?: string[]
    }) {
        super(props)
    }

    override get message(): string {
        const name =
            this.tokens?.map((token) => token.value).join(' ') ||
            this.resource?.name!
        return `${bold(blue(`"${name}"`))}라는 변수나 약속을 찾을 수 없어요.${
            this.resource?.suggestedFix
                ? ` 혹시 ${bold(
                      blue(`"${this.resource.suggestedFix}"`),
                  )}를 찾으시나요?`
                : ''
        }`
    }
}
