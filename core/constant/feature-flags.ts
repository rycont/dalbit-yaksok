export enum FEATURE_FLAG {
    /**
     * 약속 호출에서 신문법 사용을 강제합니다. 신문법에서는 인자에 괄호를 사용해야만 합니다. 예를 들어, `("치킨")먹기`는 가능하지만 `"치킨" 먹기`는 불가능합니다.
     */
    FUTURE_FUNCTION_INVOKE_SYNTAX = 'future-function-invoke-syntax',
    /**
     * "반복" 구문 내에 멈춤 코드(약속 그만, 반복 그만, 돌려주기)가 없어도 유효성 검사에 실패하지 않습니다.
     */
    SKIP_VALIDATE_BREAK_OR_RETURN_IN_LOOP = 'skip-validate-break-or-return-in-loop',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
