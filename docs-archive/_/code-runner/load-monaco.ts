let monaco: typeof import('monaco-editor')

export async function loadMonaco() {
    if (monaco) {
        return monaco
    }

    monaco = await import('monaco-editor')
    return monaco
}
