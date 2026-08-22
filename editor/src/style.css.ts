import {
    keyframes,
    globalStyle,
    generateIdentifier,
} from '@vanilla-extract/css'

export const bezier = 'cubic-bezier(0.16, 1, 0.3, 1)'
const GRID_COLOR = '#D7D7D7'

export const editorId = generateIdentifier()

export const borderBreath = keyframes({
    '0%': {
        opacity: 0.6,
    },
    '100%': {
        opacity: 1,
    },
})

function styleCodeMirror(
    selector: string,
    rule: Parameters<typeof globalStyle>[1],
) {
    globalStyle(`#${editorId} ${selector}`, rule)
}

styleCodeMirror(`.cm-focused > .cm-scroller > .cm-cursorLayer`, {
    animation: `${borderBreath} 1s 500ms infinite alternate-reverse`,
})

styleCodeMirror('.cm-selectionLayer', {
    zIndex: -1,
})

styleCodeMirror(`.cm-selectionBackground`, {
    background: 'rgba(65, 96, 173, 0.2)',
    borderInline: '2px solid rgb(65, 96, 173)',
    transitionDuration: '500ms',
    transitionTimingFunction: bezier,
})

styleCodeMirror('.cm-cursor', {
    marginLeft: '0',
    transitionDuration: '500ms',
    transitionTimingFunction: bezier,
})

styleCodeMirror('.cm-content', {
    padding: '0',
})

styleCodeMirror('.cm-content::before', {
    inset: 0,
    position: 'absolute',
    content: ' ',
    zIndex: -3,
    backgroundImage: `
        linear-gradient(to right,  ${GRID_COLOR} 1px, transparent 1px),
        linear-gradient(to bottom, ${GRID_COLOR} 1px, transparent 1px),
        linear-gradient(to top,    ${GRID_COLOR} 1px, transparent 1px)`,
    backgroundSize: '1ch 1lh, 1ch 1lh, 100% 100%',
})
