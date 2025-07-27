import type { Position } from '../../type/position.ts'

export enum TOKEN_TYPE {
    NUMBER = 'NUMBER',
    ASSIGNER = 'ASSIGNER',
    STRING = 'STRING',
    OPERATOR = 'OPERATOR',
    SPACE = 'SPACE',
    INDENT = 'INDENT',
    IDENTIFIER = 'IDENTIFIER',
    COMMA = 'COMMA',
    COLON = 'COLON',
    OPENING_PARENTHESIS = 'OPENING_PARENTHESIS',
    CLOSING_PARENTHESIS = 'CLOSING_PARENTHESIS',
    OPENING_BRACKET = 'OPENING_BRACKET',
    CLOSING_BRACKET = 'CLOSING_BRACKET',
    OPENING_BRACE = 'OPENING_BRACE',
    CLOSING_BRACE = 'CLOSING_BRACE',
    FFI_BODY = 'FFI_BODY',
    NEW_LINE = 'NEW_LINE',
    LINE_COMMENT = 'LINE_COMMENT',
    MENTION = 'MENTION',
    UNKNOWN = 'UNKNOWN',
}

export interface Token {
    type: TOKEN_TYPE
    value: string
    position: Position
}

export const TOKEN_TYPE_TO_TEXT: Record<TOKEN_TYPE, string> = {
    [TOKEN_TYPE.NUMBER]: '숫자',
    [TOKEN_TYPE.STRING]: '문자',
    [TOKEN_TYPE.ASSIGNER]: '값 넣기',
    [TOKEN_TYPE.OPERATOR]: '연산자',
    [TOKEN_TYPE.SPACE]: '공백',
    [TOKEN_TYPE.INDENT]: '들여쓰기',
    [TOKEN_TYPE.IDENTIFIER]: '식별자',
    [TOKEN_TYPE.COMMA]: '쉼표',
    [TOKEN_TYPE.COLON]: '쌍점',
    [TOKEN_TYPE.OPENING_PARENTHESIS]: '여는 괄호',
    [TOKEN_TYPE.CLOSING_PARENTHESIS]: '닫는 괄호',
    [TOKEN_TYPE.OPENING_BRACKET]: '여는 대괄호',
    [TOKEN_TYPE.CLOSING_BRACKET]: '닫는 대괄호',
    [TOKEN_TYPE.OPENING_BRACE]: '여는 중괄호',
    [TOKEN_TYPE.CLOSING_BRACE]: '닫는 중괄호',
    [TOKEN_TYPE.FFI_BODY]: '번역 코드',
    [TOKEN_TYPE.NEW_LINE]: '줄바꿈',
    [TOKEN_TYPE.LINE_COMMENT]: '주석',
    [TOKEN_TYPE.MENTION]: '불러오기',
    [TOKEN_TYPE.UNKNOWN]: '알 수 없음',
}
