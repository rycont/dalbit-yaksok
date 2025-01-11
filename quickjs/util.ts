export function bold(text: string | number) {
    return `\x1b[1m${text}\x1b[0m`
}

export function dim(text: string | number) {
    return `\x1b[2m${text}\x1b[0m`
}
