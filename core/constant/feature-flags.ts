export enum FEATURE_FLAG {
    
    /**
     * "반복" 구문 내에 멈춤 코드(약속 그만, 반복 그만, 돌려주기)가 없어도 유효성 검사에 실패하지 않습니다.
     */
    SKIP_VALIDATE_BREAK_OR_RETURN_IN_LOOP = 'skip-validate-break-or-return-in-loop',
}

export type EnabledFlags = Partial<Record<FEATURE_FLAG, boolean>>
