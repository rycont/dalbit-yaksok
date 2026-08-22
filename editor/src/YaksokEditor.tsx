import interludeCodeSquarePath from '../font/InterludeCodeSquare.woff2'
import {
    defaultKeymap,
    insertTab,
    temporarilySetTabFocusMode,
} from '@codemirror/commands'
import { drawSelection, EditorView, keymap } from '@codemirror/view'
import { GRID_SIZE } from './constant.ts'
import { editorId } from './style.css.ts'
import { EditorState } from '@codemirror/state'
import { snippetCompletion, autocompletion } from '@codemirror/autocomplete'

export const bezier = 'cubic-bezier(0.16, 1, 0.3, 1)'
const interludeCodeSquare = new FontFace(
    'interlude-code-square',
    `url("${interludeCodeSquarePath}")`,
)

await interludeCodeSquare.load()
document.fonts.add(interludeCodeSquare)

const myTheme = EditorView.theme({
    '&.cm-focused': {
        outline: 'none',
    },
    '.cm-scroller': {
        fontFamily: interludeCodeSquare.family,
        lineHeight: 1,
    },
    '.cm-content': {
        fontFamily: interludeCodeSquare.family,
        fontSize: GRID_SIZE,
    },
    '.cm-line': { padding: '0' },
})

export function Editor(parent: HTMLElement): void {
    parent.id = editorId
    const view = new EditorView({
        parent,

        extensions: [
            myTheme,
            drawSelection(),
            keymap.of([
                { key: 'Tab', run: insertTab },
                { key: 'Escape', run: temporarilySetTabFocusMode },
            ]),
            keymap.of(defaultKeymap),
            EditorState.tabSize.of(1),
        ],
    })

    view.focus()
}
