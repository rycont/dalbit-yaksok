export type ClassType<T extends unknown = unknown> = new (...args: any[]) => T

export const SIGNALS = {
    REQUEST_FOR_FIELD_NAME: Symbol(),
}
