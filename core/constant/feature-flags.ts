export enum FEATURE_FLAG {
    /**
     * 약속 호출에서 신문법 사용을 강제합니다. 신문법에서는 인자에 괄호를 사용해야만 합니다. 예를 들어, `("치킨")먹기`는 가능하지만 `"치킨" 먹기`는 불가능합니다.
     */
    FUTURE_FUNCTION_INVOKE_SYNTAX = 'future-function-invoke-syntax',
    /**
     * 동등 비교 연산자(EqualOperator)를 `=`에서 `==`로 바꿉니다.
     */
    EQUAL_OPERATOR_DOUBLE_EQUAL = 'equal-operator-double-equal',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
