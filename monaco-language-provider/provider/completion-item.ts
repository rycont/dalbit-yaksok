import type { editor, languages, Position } from 'monaco-editor'
import { BaseProvider } from './base.ts'

// From editor.api.d.ts
export enum CompletionItemKind {
    Method = 0,
    Function = 1,
    Constructor = 2,
    Field = 3,
    Variable = 4,
    Class = 5,
    Struct = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Event = 10,
    Operator = 11,
    Unit = 12,
    Value = 13,
    Constant = 14,
    Enum = 15,
    EnumMember = 16,
    Keyword = 17,
    Text = 18,
    Color = 19,
    File = 20,
    Reference = 21,
    Customcolor = 22,
    Folder = 23,
    TypeParameter = 24,
    User = 25,
    Issue = 26,
    Snippet = 27,
}

const COMPLETION_SNIPPETS = [
    {
        label: '보여주기',
        kind: CompletionItemKind.Keyword,
        insertText: '보여주기',
        detail: '값을 화면에 보여줘요',
    },
    {
        label: '약속',
        kind: CompletionItemKind.Snippet,
        insertText: '약속, ',
        detail: '새 약속을 만들어요',
    },
    {
        label: '결과',
        kind: CompletionItemKind.Snippet,
        insertText: '결과: ',
        detail: '약속의 결과를 설정해요',
    },
]

export function setupCompletion(editorInstance: editor.IStandaloneCodeEditor) {
    editorInstance.onDidChangeModelContent(() => {
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
            snippet.label.includes(word),
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
        const word = model.getWordUntilPosition(position).word.trim()

        if (word.length === 0) {
            return {
                suggestions: [],
            }
        }

        const matchedItems = COMPLETION_SNIPPETS.map((item) => ({
            score: item.label.startsWith(word)
                ? 2
                : item.label.includes(word)
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
                    startColumn: position.column - word.length,
                    endColumn: position.column,
                },
            })),
        }
    }
}
