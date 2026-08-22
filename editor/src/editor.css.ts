import { style } from '@vanilla-extract/css'

export const wrapper: string = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '42rem',
    fontFamily:
        "'Pretendard', 'Apple SD Gothic Neo', system-ui, sans-serif",
    padding: '1rem',
    border: '1px solid #d8d8e0',
    borderRadius: '12px',
    backgroundColor: '#fafafc',
})

export const label: string = style({
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#3c3c46',
    margin: 0,
})

export const textarea: string = style({
    width: '100%',
    minHeight: '10rem',
    padding: '0.75rem',
    border: '1px solid #c9c9d4',
    borderRadius: '8px',
    fontFamily:
        "'D2Coding', 'JetBrains Mono', ui-monospace, monospace",
    fontSize: '0.9rem',
    lineHeight: 1.6,
    resize: 'vertical',
    boxSizing: 'border-box',
    selectors: {
        '&:focus': {
            outline: '2px solid #f5a623',
            outlineOffset: '1px',
        },
    },
})

export const runButton: string = style({
    alignSelf: 'flex-start',
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#f5a623',
    color: '#1c1c22',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    selectors: {
        '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
        },
        '&:hover:not(:disabled)': {
            backgroundColor: '#e09612',
        },
    },
})

export const output: string = style({
    margin: 0,
    padding: '0.75rem',
    minHeight: '3rem',
    backgroundColor: '#23232b',
    color: '#e8e8ef',
    borderRadius: '8px',
    fontFamily: "ui-monospace, 'D2Coding', monospace",
    fontSize: '0.85rem',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
})
