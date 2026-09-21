export function bold(text: string | number) {
    return `\x1b[1m${text}\x1b[0m`
}

export function blue(text: string | number) {
    return `\x1b[34m${text}\x1b[0m`
}

export function dim(text: string | number) {
    return `\x1b[2m${text}\x1b[0m`
}

export function border(text: string) {
    return `\x1b[38;2;80;80;80m${text}\x1b[0m`
}

export function underline(text: string | number) {
    return `\x1b[4m${text}\x1b[24m`
}
