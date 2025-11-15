export enum FEATURE_FLAG {
    /**
     * "반복" 구문 내에 멈춤 코드(약속 그만, 반복 그만, 돌려주기)가 없어도 유효성 검사에 실패하지 않습니다.
     */
    SKIP_VALIDATE_BREAK_OR_RETURN_IN_LOOP = 'skip-validate-break-or-return-in-loop',

    /**
     * 대괄호를 우선하여 파싱하지 않습니다. 파싱 오류가 발생할 경우 이 옵션이 도움이 될 수 있습니다.
     */
    DISABLE_BRACKET_FIRST_PARSING = 'disable-bracket-first-parsing',

    /**
     * 약속 호출 스택 깊이 제한을 비활성화합니다. 활성화할 시 CallStackDepthExceededError가 발생하지 않습니다.
     */
    DISABLE_CALL_STACK_DEPTH_LIMIT = 'disable-call-stack-depth-limit',

    /**
     * 변수 설정/읽기 이벤트를 비활성화합니다. 활성화할 시 variableSet, variableRead 이벤트가 발생하지 않습니다.
     */
    DISABLE_VARIABLE_EVENTS = 'disable-variable-events',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
