import { CancellationToken, editor, languages, Position } from 'monaco-editor'
import { BaseProvider } from './base.ts'
import { hangulToPhoneme } from '../hangul-to-phoneme.ts'

const COMPLETION_SNIPPETS = createPhonemeIndexedSnippets([
    {
        label: '보여주기',
        kind: languages.CompletionItemKind.Keyword,
        insertText: '보여주기',
        detail: '값을 화면에 보여줘요',
    },
    {
        label: '약속',
        kind: languages.CompletionItemKind.Snippet,
        insertText: '약속, ',
        detail: '새 약속을 만들어요',
    },
    {
        label: '결과',
        kind: languages.CompletionItemKind.Snippet,
        insertText: '결과: ',
        detail: '약속의 결과를 설정해요',
    },
])

export function setupCompletion(editorInstance: editor.IStandaloneCodeEditor) {
    editorInstance.onDidChangeModelContent((e) => {
        const position = editorInstance.getPosition()

        if (!position) {
            return
        }

        const model = editorInstance.getModel()

        if (!model) {
            return
        }

        let { word } = model.getWordUntilPosition(position)
        word = word.trim()

        if (word.length === 0) {
            return
        }

        const isMatched = COMPLETION_SNIPPETS.some((snippet) =>
            snippet.phoneme.includes(hangulToPhoneme(word)),
        )

        if (!isMatched) {
            return
        }

        editorInstance.trigger('dalbityaksok', 'hideSuggestWidget', {})
        editorInstance.trigger('dalbityaksok', 'editor.action.triggerSuggest', {
            auto: true,
        })
    })
}

export class CompletionItemProvider
    implements languages.CompletionItemProvider
{
    constructor(private _base: BaseProvider) {}

    provideCompletionItems(
        model: editor.ITextModel,
        position: Position,
    ): languages.ProviderResult<languages.CompletionList> {
        const { word } = model.getWordUntilPosition(position)
        const wordPhoneme = hangulToPhoneme(word)

        if (wordPhoneme.length === 0) {
            return {
                suggestions: [],
            }
        }

        const matchedItems = COMPLETION_SNIPPETS.map((item) => ({
            score: item.phoneme.startsWith(wordPhoneme)
                ? 2
                : item.phoneme.includes(wordPhoneme)
                ? 1
                : 0,
            item,
        }))
            .filter(({ score }) => score > 0)
            .toSorted((a, b) => b.score - a.score)
            .map(({ item }) => item)

        return {
            suggestions: matchedItems.map((item) => ({
                ...item,
                range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                },
            })),
        }
    }
}

function createPhonemeIndexedSnippets<T extends { label: string }>(
    items: T[],
): (T & {
    phoneme: string
})[] {
    return items.map((item) => ({
        ...item,
        phoneme: hangulToPhoneme(item.label),
    }))
}
