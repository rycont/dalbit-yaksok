package interpreter

// TokenType represents the type of a token.
type TokenType string

// Token represents a lexical token.
type Token struct {
	Type    TokenType
	Literal string
}

// Defines all possible token types
const (
	// Special tokens
	ILLEGAL TokenType = "ILLEGAL" // An unknown token/character
	EOF     TokenType = "EOF"     // End Of File

	// Identifiers & Literals
	IDENT  TokenType = "IDENT"  // identifiers: add, foobar, x, y, ...
	INT    TokenType = "INT"    // 12345
	FLOAT  TokenType = "FLOAT"  // 3.14
	STRING TokenType = "STRING" // "hello world"

	// Operators
	ASSIGN   TokenType = "="
	PLUS     TokenType = "+"
	MINUS    TokenType = "-"
	ASTERISK TokenType = "*"
	SLASH    TokenType = "/"

	BANG   TokenType = "!"
	LT     TokenType = "<"
	GT     TokenType = ">"
	EQ     TokenType = "=="
	NOT_EQ TokenType = "!="
	// TODO: Add LTEQ (<=), GTEQ (>=) if needed by the language spec

	// Delimiters (괄호 등은 Yak 구문에 따라 추가)
	COMMA  TokenType = ","
	LPAREN TokenType = "(" // 예: 함수 호출 시 사용될 수 있음
	RPAREN TokenType = ")"

	// Keywords (Yak 언어에 맞춰 정의)
	// 실제 토크나이저는 식별자를 읽은 후, 이 맵을 참조하여 키워드인지 판별.
	// TokenType 자체는 IDENT가 되고, 파서에서 Literal 값을 보고 키워드로 해석할 수도 있음.
	// 또는, 토크나이저 레벨에서 키워드 타입으로 바로 분류할 수도 있음. 후자를 택함.
	KEYWORD_SHOW TokenType = "보여주기" // "보여주기"
	KEYWORD_IF   TokenType = "만약"   // "만약"
	KEYWORD_FN   TokenType = "약속"   // "약속"
	// TODO: Add other keywords like "아니면", "그리고", "또는" etc.
)

// keywords maps identifier strings to their TokenType
var keywords = map[string]TokenType{
	"보여주기": KEYWORD_SHOW,
	"만약":   KEYWORD_IF,
	"약속":   KEYWORD_FN,
}

// LookupIdent checks the keywords table for an identifier's TokenType.
// If it's not a keyword, it's a user-defined IDENT.
func LookupIdent(ident string) TokenType {
	if tok, ok := keywords[ident]; ok {
		return tok
	}
	return IDENT
}
