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
     * 수식 연산에 Execution Delay를 적용하지 않습니다. 활성화할 시 수식에서는 runningCode 이벤트도 발생하지 않습니다.
     */
    DISABLE_OPERAND_EXECUTION_DELAY = 'disable-operand-execution-delay',

    /**
     * 약속 호출 스택 깊이 제한을 비활성화합니다. 활성화할 시 CallStackDepthExceededError가 발생하지 않습니다.
     */
    DISABLE_CALL_STACK_DEPTH_LIMIT = 'disable-call-stack-depth-limit',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
