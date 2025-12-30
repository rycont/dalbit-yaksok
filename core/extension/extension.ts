import { FunctionInvokingParams } from '../constant/type.ts'
import type { Rule } from '../prepare/parse/type.ts'
import { ValueType } from '../value/base.ts'
import type { Scope } from '../executer/scope.ts'

/**
 * `달빛 약속` 확장이 제공하는 기능과 메타데이터를 정의하는 매니페스트입니다.
 *
 * 이 매니페스트는 `달빛 약속` 런타임에게 확장이 어떤 능력을 가지고 있는지 알려주는 역할을 합니다.
 * 예를 들어, `ffiRunner`는 이 확장이 외부 코드를 실행할 수 있는 FFI(Foreign Function Interface) 런타임임을 명시합니다.
 */
export interface ExtensionManifest {
    /**
     * 확장이 FFI 런타임을 제공하는 경우, 해당 런타임의 정보를 명시합니다.
     */
    ffiRunner?: {
        /**
         * FFI 런타임을 식별하는 고유한 이름입니다. (예: "QuickJS", "Pyodide")
         * `번역` 구문에서 이 이름을 사용하여 특정 런타임을 지정합니다.
         */
        runtimeName: string
    }

    /**
     * 확장이 파싱 규칙을 제공하는 경우, 해당 규칙을 명시합니다.
     */
    parsingRules?: Rule[]
}

/**
 * `달빛 약속`의 기능을 확장하기 위한 표준 인터페이스입니다.
 *
 * 이 인터페이스를 구현하여 `YaksokSession`에 등록하면,
 * `달빛 약속` 코드 내에서 외부 시스템(예: JavaScript, Python, 파일 시스템)과 상호작용하는
 * FFI(Foreign Function Interface) 기능을 제공할 수 있습니다.
 *
 * @see YaksokSession.extend
 *
 * @example
 * ```ts
 * // 간단한 동기 FFI 런타임을 구현하는 예시
 * class MySimpleFFI implements Extension {
 *   manifest: ExtensionManifest = {
 *     ffiRunner: {
 *       runtimeName: 'MySimpleFFI',
 *     },
 *   };
 *
 *   executeFFI(code: string, args: Record<string, any>) {
 *     // 실제로는 여기서 `code`와 `args`를 사용하여 외부 로직을 실행합니다.
 *     console.log(`Executing in MySimpleFFI: ${code}`);
 *     // 결과를 달빛 약속의 값 타입으로 변환하여 반환해야 합니다.
 *     return new StringValue("FFI 결과");
 *   }
 * }
 *
 * // 사용법
 * const session = new YaksokSession();
 * await session.extend(new MySimpleFFI());
 * await session.yaksok(`번역 "MySimpleFFI" "코드" 결과`);
 * ```
 */
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
