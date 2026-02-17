import {
    Extension,
    ExtensionManifest,
    FunctionInvokingParams,
    InstanceValue,
    Scope,
    StringValue,
    ValueType,
    YaksokSession,
} from '../../core/mod.ts'

/**
 * HTML Input Element를 감싸는 ValueType
 * InstanceValue를 상속받아 '값' 프로퍼티를 가질 수 있게 함
 */
class HTMLInputValue extends InstanceValue {
    element: HTMLInputElement

    constructor(element: HTMLInputElement) {
        super('HTMLInput')
        this.element = element
        this.scope = new Scope()
        this.memberLookupRootScope = this.scope

        // 초기 '값' 설정
        this.updateValue()

        // 입력 변경 시 '값' 업데이트
        this.element.addEventListener('input', () => {
            this.updateValue()
        })
    }

    updateValue() {
        // 토큰은 임시로 빈 배열
        this.scope.setLocalVariable(
            '값',
            new StringValue(this.element.value || ''),
            [],
        )
    }

    toPrint(): string {
        return this.element.value || ''
    }
}

class HTMLButtonValue extends InstanceValue {
    static friendlyName = '버튼'
    element: HTMLButtonElement

    constructor(element: HTMLButtonElement) {
        super('HTMLButton')
        this.element = element
        this.scope = new Scope()
        this.memberLookupRootScope = this.scope
    }

    toPrint(): string {
        return `버튼(${this.element.innerText})`
    }
}

class HTMLTextValue extends InstanceValue {
    static friendlyName = '텍스트'
    element: HTMLElement

    constructor(element: HTMLElement) {
        super('HTMLText')
        this.element = element
        this.scope = new Scope()
        this.memberLookupRootScope = this.scope
    }

    toPrint(): string {
        return this.element.innerText
    }
}

class HTMLBoxValue extends InstanceValue {
    static friendlyName = '박스'
    element: HTMLElement

    constructor(element: HTMLElement) {
        super('HTMLBox')
        this.element = element
        this.scope = new Scope()
        this.memberLookupRootScope = this.scope
    }

    toPrint(): string {
        return '박스'
    }
}

export class WebExtension implements Extension {
    manifest: ExtensionManifest = {
        ffiRunner: { runtimeName: 'Web' },
        module: {
            'web-std': `
번역(Web), 제목 (내용) 그리기
***
{ "type": "title" }
***

번역(Web), 문자 입력칸 (질문) 그리기
***
{ "type": "input-text" }
***

번역(Web), 숫자 입력칸 (질문) 그리기
***
{ "type": "input-number" }
***

번역(Web), (내용) 화면에 그리기
***
{ "type": "print" }
***

번역(Web), 버튼 (내용) 그리기
***
{ "type": "create-button" }
***

번역(Web), 텍스트 (내용) 그리기
***
{ "type": "create-text" }
***

번역(Web), (개체)에 (내용) 그리기
***
{ "type": "set-text" }
***

번역(Web), 박스 그리기
***
{ "type": "create-box" }
***

번역(Web), (부모)에 (자식) 넣기
***
{ "type": "append-child" }
***

번역(Web), (개체) 비우기
***
{ "type": "clear-content" }
***

번역(Web), (개체) 지우기
***
{ "type": "remove-element" }
***

메소드(값), 이벤트(click), 눌렀을 때
`,
        },
    }

    private app: HTMLElement
    private session: YaksokSession | null = null

    constructor() {
        this.app = document.getElementById('app')!
        if (!this.app) {
            this.app = document.createElement('div')
            this.app.id = 'app'
            document.body.appendChild(this.app)
        }
    }

    bindSession(session: YaksokSession) {
        this.session = session
    }

    async init() {
        if (!this.session) return

        this.session.eventCreation.sub('click', (args, callback, terminate) => {
            const target = args['자신']
            if (
                target instanceof HTMLButtonValue ||
                target instanceof HTMLTextValue ||
                target instanceof HTMLBoxValue
            ) {
                target.element.addEventListener('click', () => {
                    callback()
                    // 이벤트는 계속 발생할 수 있으므로 terminate 호출 안함
                })
            } else if (target instanceof HTMLInputValue) {
                target.element.addEventListener('click', () => {
                    callback()
                })
            }
        })
    }

    executeFFI(code: string, args: FunctionInvokingParams): ValueType {
        const payload = JSON.parse(code)
        const params = args

        if (payload.type === 'title') {
            const h1 = document.createElement('h1')
            const content = params['내용']
            h1.innerText = content.toPrint()
            this.app.appendChild(h1)
            return new StringValue(h1.innerText)
        }

        if (payload.type === 'input-text' || payload.type === 'input-number') {
            const block = document.createElement('div')
            block.className = 'input-block'

            const label = document.createElement('label')
            const question = params['질문']
            label.innerText = question.toPrint()

            const input = document.createElement('input')
            input.type = payload.type === 'input-number' ? 'number' : 'text'
            input.placeholder = '입력해주세요'

            block.appendChild(label)
            block.appendChild(input)
            this.app.appendChild(block)

            return new HTMLInputValue(input)
        }

        if (payload.type === 'print') {
            const p = document.createElement('p')
            p.className = 'result-text'
            const content = params['내용']
            p.innerText = content.toPrint()
            this.app.appendChild(p)
            return new StringValue(p.innerText)
        }

        if (payload.type === 'create-button') {
            const button = document.createElement('button')
            const content = params['내용']
            button.innerText = content.toPrint()
            this.app.appendChild(button)
            return new HTMLButtonValue(button)
        }

        if (payload.type === 'create-text') {
            const p = document.createElement('p')
            p.className = 'result-text'
            const content = params['내용']
            p.innerText = content.toPrint()
            this.app.appendChild(p)
            return new HTMLTextValue(p)
        }

        if (payload.type === 'set-text') {
            const target = params['개체']
            const content = params['내용']

            if (target instanceof HTMLTextValue) {
                target.element.innerText = content.toPrint()
                return new StringValue(target.element.innerText)
            }
            // fallback
            return new StringValue('')
        }

        if (payload.type === 'create-box') {
            const div = document.createElement('div')
            div.className = 'box'
            this.app.appendChild(div)
            return new HTMLBoxValue(div)
        }

        if (payload.type === 'append-child') {
            const parent = params['부모']
            const child = params['자식']

            if (parent instanceof HTMLBoxValue) {
                let childElement: HTMLElement | null = null

                if (child instanceof HTMLButtonValue)
                    childElement = child.element
                else if (child instanceof HTMLTextValue)
                    childElement = child.element
                else if (child instanceof HTMLInputValue) {
                    // For input-block, we need to move the parent wrapper, not just the input
                    // Since create-input appends the block to this.app currently.
                    // The input element's parent is the block.
                    childElement = child.element.parentElement
                } else if (child instanceof HTMLBoxValue) {
                    childElement = child.element
                }

                if (childElement) {
                    parent.element.appendChild(childElement)
                }
            }
            return new StringValue('Success')
        }

        if (payload.type === 'clear-content') {
            const target = params['개체']
            if (target instanceof HTMLInputValue) {
                target.element.value = ''
                target.updateValue()
            }
            return new StringValue('Success')
        }

        if (payload.type === 'remove-element') {
            const target = params['개체']
            if (
                target instanceof HTMLBoxValue ||
                target instanceof HTMLTextValue ||
                target instanceof HTMLButtonValue
            ) {
                target.element.remove()
            } else if (target instanceof HTMLInputValue) {
                // Remove the wrapper block
                target.element.parentElement?.remove()
            }
            return new StringValue('Success')
        }

        throw new Error(`Unknown action: ${payload.type}`)
    }
}
