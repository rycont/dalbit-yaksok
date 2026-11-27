import type { ValueType, RDRule, RunFrame } from '@dalbit-yaksok/core'

enum CapabilityType {
    FFI = 'FFI',
    Grammer = 'Grammer',
    File = 'File',
}

interface Capability {
    [CapabilityType.FFI]?: FFICapability[]
    [CapabilityType.Grammer]?: GrammerCapability
    [CapabilityType.File]?: FileCapability
}

type Promisable<T> = T | Promise<T>

export interface FFICapability {
    runtimeId: string
    run: (
        code: string,
        args: Map<string, ValueType>,
        callerFrame: RunFrame,
    ) => Promisable<ValueType>
}

export type GrammerCapability = RDRule[]

export type FileCapability = {
    fileName: string
    code: string
    baseScope?: boolean
}[]

export interface Extension {
    capabilties: Capability
}
