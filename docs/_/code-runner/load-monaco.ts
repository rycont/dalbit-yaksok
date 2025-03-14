let monaco: typeof import('monaco-editor/esm/vs/editor/editor.api')

export async function loadMonaco() {
    if (monaco) {
        return monaco
    }

    monaco = await import('monaco-editor/esm/vs/editor/editor.api')
    return monaco
}
