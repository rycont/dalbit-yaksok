import { FunctionInvokingParams } from '../constant/type.ts'
import { ValueType } from '../value/base.ts'

import type { Scope } from '../executer/scope.ts'

export interface ExtensionManifest {
    ffiRunner?: {
        runtimeName?: string
    }

    module?: {
        fileName: string
        code: string
        baseScope?: boolean
    }[]
}

export interface Extension {
    /**
     * 확장이 세션에 등록될 때 호출되는 선택적 초기화 함수입니다.
     * 비동기적인 설정 작업(예: Wasm 모듈 로딩, 네트워크 연결)에 사용될 수 있습니다.
     */
    init?(): Promise<void> | void
    /**
     * `번역` 구문을 통해 외부 코드를 실행하는 핵심 메서드입니다.
     * @param code - `번역` 구문에서 실행하도록 지정된 코드 문자열입니다.
     * @param args - 코드 실행에 필요한 값들입니다. `달빛 약속`의 변수들이 이 객체를 통해 전달됩니다.
     * @returns 실행 결과를 `달빛 약속`이 이해할 수 있는 `ValueType`으로 변환하여 반환해야 합니다. 비동기 작업도 지원됩니다.
     */
    executeFFI(
        code: string,
        args: FunctionInvokingParams,
        callerScope: Scope,
    ): ValueType | Promise<ValueType>
    /**
     * 확장의 기능과 메타데이터를 담고 있는 매니페스트 객체입니다.
     * @see ExtensionManifest
     */
    manifest: ExtensionManifest
}
