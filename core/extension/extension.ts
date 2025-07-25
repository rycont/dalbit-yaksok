import { FunctionInvokingParams, ValueType } from '@dalbit-yaksok/core'

export interface ExtensionManifest {
    ffiRunner?: {
        runtimeName: string
    }
    // Add other capabilities as needed
}

export interface Extension {
    init?(): Promise<void> | void
    executeFFI(
        code: string,
        args: FunctionInvokingParams,
    ): ValueType | Promise<ValueType>
    manifest: ExtensionManifest
}
