export enum FEATURE_FLAG {
    /**
     * 약속 호출에서 신문법 사용을 강제합니다. 신문법에서는 인자에 괄호를 사용해야만 합니다. 예를 들어, `("치킨")먹기`는 가능하지만 `"치킨" 먹기`는 불가능합니다.
     */
    FUTURE_FUNCTION_INVOKE_SYNTAX = 'future-function-invoke-syntax',
    /**
     * loop 클래스의 validate 메소드에서, 반복문 내에 반복을 멈출 수 있는 코드가 존재하는지 검사하는 과정을 건너뛴다.
     */
    DISABLE_DETECT_NO_BREAK_OR_RETURN_ERROR = 'disable-detect-no-break-or-return-error',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
