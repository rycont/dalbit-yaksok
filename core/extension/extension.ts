import { FunctionInvokingParams, ValueType } from '@dalbit-yaksok/core'

export interface ExtensionManifest {
    ffiRunner?: {
        runtimeName: string
    }
    // Add other capabilities as needed
}

export interface Extension {
    init(): Promise<void>
    executeFFI(
        code: string,
        args: FunctionInvokingParams,
    ): ValueType | Promise<ValueType> | undefined
    manifest: ExtensionManifest
}
