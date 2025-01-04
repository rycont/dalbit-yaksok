import type { languages, editor } from 'monaco-editor'

import { BaseProvider } from './provider/base.ts'
import { TokensProvider } from './provider/tokens.ts'
import {
    CompletionItemProvider,
    setupCompletion,
} from './provider/completion-item.ts'
import { LANG_ID } from './const.ts'

export class DalbitYaksokApplier {
    baseProvider: BaseProvider

    tokensProvider: TokensProvider
    completionItemProvider: CompletionItemProvider

    constructor(initialCode: string) {
        this.baseProvider = new BaseProvider(initialCode)

        this.tokensProvider = new TokensProvider(this.baseProvider)
        this.completionItemProvider = new CompletionItemProvider(
            this.baseProvider,
        )
    }

    public async register(languagesInstance: typeof languages) {
        languagesInstance.register({ id: LANG_ID })

        await new Promise<void>((resolve) =>
            languagesInstance.onLanguage(LANG_ID, resolve),
        )

        languagesInstance.setLanguageConfiguration(LANG_ID, {
            comments: {
                lineComment: '#',
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')'],
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"', notIn: ['string'] },
                { open: "'", close: "'", notIn: ['string'] },
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ],
        })

        languagesInstance.setTokensProvider(LANG_ID, this.tokensProvider)
        languagesInstance.registerCompletionItemProvider(
            LANG_ID,
            this.completionItemProvider,
        )
    }

    public configAutocomplete(editorInstance: editor.IStandaloneCodeEditor) {
        setupCompletion(editorInstance, this.baseProvider)
    }

    updateCode(code: string) {
        this.baseProvider.updateCode(code)
    }
}

export { LANG_ID }
