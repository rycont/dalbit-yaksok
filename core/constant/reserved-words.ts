export const RESERVED_WORDS = new Set([
    'if',
    'elif',
    'else',
    '아니면',
    '만약',
    '이면',
    '보여주기',
    '반복',
    '그만',
    '약속',
    '메소드',
    '마다',
    '이고',
    '고',
    '이거나',
    '거나',
    '번역',
    '잠깐',
    '멈추기',
    '자신',
    '상위',
    '람다',
    '마다',
])

// 함수 헤더의 정적 문구에서는 아래 예약어만 예외적으로 허용합니다.
// 예: `약속, (값)에서 상위 (N)개 찾기`
export const FUNCTION_HEADER_STATIC_RESERVED_WORDS_ALLOWLIST = new Set([
    '상위',
    '고고',
    '이고',
    '거나',
    '잠깐',
])
