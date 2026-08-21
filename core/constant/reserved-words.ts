export const RESERVED_WORDS = new Set([
    '아니면',
    '만약',
    '이면',
    '보여주기',
    '반복',
    '그만',
    '약속',
    '마다',
    '이고',
    '고',
    '이거나',
    '거나',
    '번역',
    '잠깐',
    '멈추기',
    '자신',
])

// 함수 헤더의 정적 문구에서는 아래 예약어만 예외적으로 허용합니다.
export const FUNCTION_HEADER_STATIC_RESERVED_WORDS_ALLOWLIST = new Set([
    '고고',
    '이고',
    '거나',
    '잠깐',
])
