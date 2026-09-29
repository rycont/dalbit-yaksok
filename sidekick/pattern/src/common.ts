export type ClassType<T extends unknown = unknown> = new (...args: any[]) => T

class RequestFieldName {
    constructor(public setName: (name: string) => void) {}
}

export const signals = {
    RequestFieldName,
}
