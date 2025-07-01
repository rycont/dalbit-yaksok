package interpreter

import (
	"testing"
)

func TestNewLexer_InitialStateAndReadChar(t *testing.T) {
	input := "abc"
	l := NewLexer(input)

	if l.ch != 'a' {
		t.Errorf("lexer.ch expected 'a', got %q", l.ch)
	}
	if l.position != 0 {
		t.Errorf("lexer.position expected 0, got %d", l.position)
	}
	if l.readPosition != 1 {
		t.Errorf("lexer.readPosition expected 1, got %d", l.readPosition)
	}

	l.readChar()
	if l.ch != 'b' {
		t.Errorf("lexer.ch after first readChar expected 'b', got %q", l.ch)
	}
	if l.position != 1 {
		t.Errorf("lexer.position after first readChar expected 1, got %d", l.position)
	}
	if l.readPosition != 2 {
		t.Errorf("lexer.readPosition after first readChar expected 2, got %d", l.readPosition)
	}

	l.readChar()
	l.readChar() // Read 'c' then EOF

	if l.ch != 0 { // EOF
		t.Errorf("lexer.ch after reading all chars expected 0 (EOF), got %q", l.ch)
	}
}

func TestNextToken_FloatsAndMixedNumbers(t *testing.T) {
	tests := []struct {
		input          string
		expectedTokens []Token
	}{
		{"3.14", []Token{{Type: FLOAT, Literal: "3.14"}, {Type: EOF, Literal: ""}}},
		{"0.5", []Token{{Type: FLOAT, Literal: "0.5"}, {Type: EOF, Literal: ""}}},
		{"123.456", []Token{{Type: FLOAT, Literal: "123.456"}, {Type: EOF, Literal: ""}}},
		{"10.0 + 0.5", []Token{{Type: FLOAT, Literal: "10.0"}, {Type: PLUS, Literal: "+"}, {Type: FLOAT, Literal: "0.5"}, {Type: EOF, Literal: ""}}},
		{"123", []Token{{Type: INT, Literal: "123"}, {Type: EOF, Literal: ""}}}, // Ensure INT still works
		{"7 / 2", []Token{{Type: INT, Literal: "7"}, {Type: SLASH, Literal: "/"}, {Type: INT, Literal: "2"}, {Type: EOF, Literal: ""}}}, // INTs around operator
		{"1.", []Token{{Type: INT, Literal: "1"}, {Type: ILLEGAL, Literal: "."}, {Type: EOF, Literal: ""}}}, // Number then dot
		{".5", []Token{{Type: ILLEGAL, Literal: "."}, {Type: INT, Literal: "5"}, {Type: EOF, Literal: ""}}}, // Dot then number
		{"1.2.3", []Token{{Type: FLOAT, Literal: "1.2"}, {Type: ILLEGAL, Literal: "."}, {Type: INT, Literal: "3"}, {Type: EOF, Literal: ""}}}, // Multiple dots
	}

	for i, tt := range tests {
		l := NewLexer(tt.input)
		t.Run(tt.input, func(t *testing.T) {
			for j, expectedToken := range tt.expectedTokens {
				tok := l.NextToken()
				if tok.Type != expectedToken.Type {
					t.Errorf("test[%d:%d] ('%s') - token type wrong. expected=%q, got=%q for literal %q", i, j, tt.input, expectedToken.Type, tok.Type, tok.Literal)
				}
				if tok.Literal != expectedToken.Literal {
					t.Errorf("test[%d:%d] ('%s') - token literal wrong. expected=%q, got=%q for type %q", i, j, tt.input, expectedToken.Literal, tok.Literal, tok.Type)
				}
			}
		})
	}
}

func TestNextToken_Strings(t *testing.T) {
	// Adjusting the complex string test for current capabilities
	// TestNextToken_Strings test cases will be:
	simpleStringsTests := []struct {
		input          string
		expectedTokens []Token
	}{
		{`"hello world"`, []Token{{Type: STRING, Literal: "hello world"}, {Type: EOF, Literal: ""}}},
		{`""`, []Token{{Type: STRING, Literal: ""}, {Type: EOF, Literal: ""}}},
		{`"여기는 한글 문자열"`, []Token{{Type: STRING, Literal: "여기는 한글 문자열"}, {Type: EOF, Literal: ""}}},
		{`"str1" "str2"`, []Token{{Type: STRING, Literal: "str1"}, {Type: STRING, Literal: "str2"}, {Type: EOF, Literal: ""}}},
		{`"unterminated string`, []Token{{Type: ILLEGAL, Literal: "unterminated string"}, {Type: EOF, Literal: ""}}},
		{`"a"`, []Token{{Type: STRING, Literal: "a"}, {Type: EOF, Literal: ""}}},
		{`"1 + 2"`, []Token{{Type: STRING, Literal: "1 + 2"}, {Type: EOF, Literal: ""}}}, // String containing operator-like chars
	}


	for i, tt := range simpleStringsTests { // Use simpleStringsTests
		l := NewLexer(tt.input)
		t.Run(tt.input, func(t *testing.T) {
			for j, expectedToken := range tt.expectedTokens {
				tok := l.NextToken()
				if tok.Type != expectedToken.Type {
					t.Errorf("test[%d:%d] ('%s') - token type wrong. expected=%q, got=%q for literal %q", i, j, tt.input, expectedToken.Type, tok.Type, tok.Literal)
				}
				if tok.Literal != expectedToken.Literal {
					t.Errorf("test[%d:%d] ('%s') - token literal wrong. expected=%q, got=%q for type %q", i, j, tt.input, expectedToken.Literal, tok.Literal, tok.Type)
				}
			}
		})
	}
}


func TestNextToken_Integers(t *testing.T) {
	tests := []struct {
		input          string
		expectedTokens []Token
	}{
		{"123", []Token{{Type: INT, Literal: "123"}, {Type: EOF, Literal: ""}}},
		{"0", []Token{{Type: INT, Literal: "0"}, {Type: EOF, Literal: ""}}},
		{"123 456", []Token{{Type: INT, Literal: "123"}, {Type: INT, Literal: "456"}, {Type: EOF, Literal: ""}}},
		{"10+20", []Token{{Type: INT, Literal: "10"}, {Type: PLUS, Literal: "+"}, {Type: INT, Literal: "20"}, {Type: EOF, Literal: ""}}},
		// Test case for negative numbers: currently Lexer sees '-' as a separate MINUS token.
		// The parser will be responsible for interpreting this as a negative number if appropriate.
		{"-5", []Token{{Type: MINUS, Literal: "-"}, {Type: INT, Literal: "5"}, {Type: EOF, Literal: ""}}},
		{"5 * 10", []Token{{Type: INT, Literal: "5"}, {Type: ASTERISK, Literal: "*"}, {Type: INT, Literal: "10"}, {Type: EOF, Literal: ""}}},
	}

	for i, tt := range tests {
		l := NewLexer(tt.input)
		t.Run(tt.input, func(t *testing.T) {
			for j, expectedToken := range tt.expectedTokens {
				tok := l.NextToken()
				if tok.Type != expectedToken.Type {
					t.Errorf("test[%d:%d] ('%s') - token type wrong. expected=%q, got=%q for literal %q", i, j, tt.input, expectedToken.Type, tok.Type, tok.Literal)
				}
				if tok.Literal != expectedToken.Literal {
					t.Errorf("test[%d:%d] ('%s') - token literal wrong. expected=%q, got=%q for type %q", i, j, tt.input, expectedToken.Literal, tok.Literal, tok.Type)
				}
			}
		})
	}
}

func TestNextToken_WithWhitespace(t *testing.T) {
	tests := []struct {
		input          string
		expectedTokens []Token
	}{
		{
			input: " + ",
			expectedTokens: []Token{
				{Type: PLUS, Literal: "+"},
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "\t=\r\n- ", // Mixed whitespace, trailing space
			expectedTokens: []Token{
				{Type: ASSIGN, Literal: "="},
				{Type: MINUS, Literal: "-"},
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: " *   / ", // Multiple spaces between and trailing
			expectedTokens: []Token{
				{Type: ASTERISK, Literal: "*"},
				{Type: SLASH, Literal: "/"},
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "   ", // Only whitespace
			expectedTokens: []Token{
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "\n\r\t", // Only whitespace characters
			expectedTokens: []Token{
				{Type: EOF, Literal: ""},
			},
		},
	}

	for i, tt := range tests {
		l := NewLexer(tt.input)
		t.Run(tt.input, func(t *testing.T) {
			for j, expectedToken := range tt.expectedTokens {
				tok := l.NextToken()
				if tok.Type != expectedToken.Type {
					t.Errorf("test[%d:%d] ('%s') - token type wrong. expected=%q, got=%q for literal %q", i, j, tt.input, expectedToken.Type, tok.Type, tok.Literal)
				}
				if tok.Literal != expectedToken.Literal {
					t.Errorf("test[%d:%d] ('%s') - token literal wrong. expected=%q, got=%q for type %q", i, j, tt.input, expectedToken.Literal, tok.Literal, tok.Type)
				}
			}
		})
	}
}

func TestNextToken_SingleCharOperators(t *testing.T) {
	// Re-introducing spaces to test skipWhitespace along with operator tokenization
	input := `+ = - * / < > !`
	expectedTokens := []Token{
		{Type: PLUS, Literal: "+"},
		{Type: ASSIGN, Literal: "="},
		{Type: MINUS, Literal: "-"},
		{Type: ASTERISK, Literal: "*"},
		{Type: SLASH, Literal: "/"},
		{Type: LT, Literal: "<"},
		{Type: GT, Literal: ">"},
		{Type: BANG, Literal: "!"},
		{Type: EOF, Literal: ""},
	}

	l := NewLexer(input)

	for i, expectedToken := range expectedTokens {
		tok := l.NextToken()
		if tok.Type != expectedToken.Type {
			t.Fatalf("tests[%d] - tokentype wrong. expected=%q, got=%q (literal %q)",
				i, expectedToken.Type, tok.Type, tok.Literal)
		}
		if tok.Literal != expectedToken.Literal {
			t.Fatalf("tests[%d] - literal wrong. expected=%q, got=%q (type %q)",
				i, expectedToken.Literal, tok.Literal, tok.Type)
		}
	}
}


func TestNextToken_EOFOnlyAndIllegal(t *testing.T) {
	tests := []struct {
		input         string
		expectedTokens []Token
	}{
		{
			input: "",
			expectedTokens: []Token{
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "+", // '+' is not yet a recognized operator token type by NextToken
			expectedTokens: []Token{
				{Type: ILLEGAL, Literal: "+"},
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "가", // Korean character, also ILLEGAL for now
			expectedTokens: []Token{
				{Type: ILLEGAL, Literal: "가"},
				{Type: EOF, Literal: ""},
			},
		},
		{
			input: "$$", // Multiple illegal characters
			expectedTokens: []Token{
				{Type: ILLEGAL, Literal: "$"},
				{Type: ILLEGAL, Literal: "$"},
				{Type: EOF, Literal: ""},
			},
		},
	}

	for i, tt := range tests {
		l := NewLexer(tt.input)
		t.Run(tt.input, func(t *testing.T) {
			for j, expectedToken := range tt.expectedTokens {
				tok := l.NextToken()
				if tok.Type != expectedToken.Type {
					t.Errorf("test[%d:%d] - token type wrong. expected=%q, got=%q for literal %q", i, j, expectedToken.Type, tok.Type, tok.Literal)
				}
				if tok.Literal != expectedToken.Literal {
					t.Errorf("test[%d:%d] - token literal wrong. expected=%q, got=%q for type %q", i, j, expectedToken.Literal, tok.Literal, tok.Type)
				}
			}
		})
	}
}
