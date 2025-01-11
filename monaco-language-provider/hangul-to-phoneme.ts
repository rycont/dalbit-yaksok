// 다음의 코드를 참고하였습니다:
// https://blex.me/@baealex/%ED%95%9C%EA%B8%80-%EB%B6%84%EB%A6%AC-%EB%B3%91%ED%95%A9#%EB%B6%84%EB%A6%AC%EA%B8%B0-%EA%B0%9C%EC%84%A0

const START_OF_HANGUL_IN_UNICODE = 44032
const END_OF_HANGUL_IN_UNICODE = 55203

const 초성 = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
]
const 중성 = [
    'ㅏ',
    'ㅐ',
    'ㅑ',
    'ㅒ',
    'ㅓ',
    'ㅔ',
    'ㅕ',
    'ㅖ',
    'ㅗ',
    'ㅘ',
    'ㅙ',
    'ㅚ',
    'ㅛ',
    'ㅜ',
    'ㅝ',
    'ㅞ',
    'ㅟ',
    'ㅠ',
    'ㅡ',
    'ㅢ',
    'ㅣ',
]

const 종성 = [
    '',
    'ㄱ',
    'ㄲ',
    'ㄳ',
    'ㄴ',
    'ㄵ',
    'ㄶ',
    'ㄷ',
    'ㄹ',
    'ㄺ',
    'ㄻ',
    'ㄼ',
    'ㄽ',
    'ㄾ',
    'ㄿ',
    'ㅀ',
    'ㅁ',
    'ㅂ',
    'ㅄ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
]

function hangulSyllableToPhoneme(syllable: string) {
    const unicodeOrder = syllable.charCodeAt(0)

    if (
        unicodeOrder < START_OF_HANGUL_IN_UNICODE ||
        unicodeOrder > END_OF_HANGUL_IN_UNICODE
    ) {
        return [syllable]
    }

    const orderInHangulArea = unicodeOrder - START_OF_HANGUL_IN_UNICODE

    const 초성_인덱스 = Math.floor(orderInHangulArea / 588)
    const 중성_인덱스 = Math.floor((orderInHangulArea - 초성_인덱스 * 588) / 28)
    const 종성_인덱스 = orderInHangulArea % 28

    if (종성[종성_인덱스]) {
        return 초성[초성_인덱스] + 중성[중성_인덱스] + 종성[종성_인덱스]
    }

    return 초성[초성_인덱스] + 중성[중성_인덱스]
}

export function hangulToPhoneme(word: string) {
    return word.split('').map(hangulSyllableToPhoneme).join('')
}
