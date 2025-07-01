package interpreter

// Lexer holds the state for lexically analyzing the input code.
type Lexer struct {
	input        []rune // Input string as a slice of runes to support Unicode (like Hangul)
	position     int    // current position in input (points to current char)
	readPosition int    // current reading position in input (after current char)
	ch           rune   // current char under examination
}

// NewLexer creates a new Lexer instance.
func NewLexer(input string) *Lexer {
	l := &Lexer{input: []rune(input)}
	l.readChar() // Initialize l.ch, l.position, and l.readPosition
	return l
}

// readChar gives us the next character and advances our position in the input string.
func (l *Lexer) readChar() {
	if l.readPosition >= len(l.input) {
		l.ch = 0 // NUL character, signifies EOF or not read yet
	} else {
		l.ch = l.input[l.readPosition]
	}
	l.position = l.readPosition
	l.readPosition++
}

func (l *Lexer) skipWhitespace() {
	for l.ch == ' ' || l.ch == '\t' || l.ch == '\n' || l.ch == '\r' {
		l.readChar()
	}
}

// NextToken looks at the current character under examination (l.ch)
// and returns the next token by calling readChar() to advance the lexer.
func (l *Lexer) NextToken() Token {
	var tok Token

	l.skipWhitespace() // Skip any whitespace before processing the token

	switch l.ch {
	case '=':
		tok = Token{Type: ASSIGN, Literal: string(l.ch)}
	case '+':
		tok = Token{Type: PLUS, Literal: string(l.ch)}
	case '-':
		tok = Token{Type: MINUS, Literal: string(l.ch)}
	case '*':
		tok = Token{Type: ASTERISK, Literal: string(l.ch)}
	case '/':
		tok = Token{Type: SLASH, Literal: string(l.ch)}
	case '<':
		tok = Token{Type: LT, Literal: string(l.ch)}
	case '>':
		tok = Token{Type: GT, Literal: string(l.ch)}
	case '!':
		tok = Token{Type: BANG, Literal: string(l.ch)}
	// TODO: Add COMMA, LPAREN, RPAREN etc.
	case '"': // Start of a string literal
		literal, terminated := l.readString()
		if terminated {
			tok.Type = STRING
		} else {
			tok.Type = ILLEGAL // Unterminated string
		}
		tok.Literal = literal
		// readString already advanced l.ch to the char after the string (or EOF)
		// so we return immediately.
		return tok
	case 0: // EOF
		tok.Literal = ""
		tok.Type = EOF
	default:
		if isDigit(l.ch) {
			literal, isFloat := l.readNumber()
			if isFloat {
				tok.Type = FLOAT
			} else {
				tok.Type = INT
			}
			tok.Literal = literal
			// readNumber has already advanced l.ch to the char after the number
			// so we return immediately without calling l.readChar() at the end of NextToken
			return tok
		} else if l.ch == '.' && isDigit(l.peekChar()) { // Handle cases like ".5"
			// This is a more advanced case, let's ensure readNumber handles it or adjust.
			// For now, our readNumber expects a digit first for the integer part.
			// To support ".5", readNumber or this part of NextToken needs adjustment.
			// Current readNumber: reads int part, then if '.', then reads fractional.
			// So, if l.ch is '.', readNumber won't read an int part first.
			// We can make readNumber handle l.ch == '.' if peekChar isDigit.
			// Let's adjust readNumber for this.
			// For now, this path will lead to ILLEGAL for '.', which is fine for current tests.
			// The tests for ".5" will guide if we need to change this.
			// Actually, the plan says: "숫자.숫자" 형태만 FLOAT으로 인식하고, "숫자." 또는 ".숫자"는 ILLEGAL로 처리될 수 있도록 단순하게 시작하겠습니다.
			// So current logic is fine.
		}
		// For now, any unrecognized character is ILLEGAL.
		// This will be refined to handle identifiers, etc.
		tok = Token{Type: ILLEGAL, Literal: string(l.ch)}
	}

	l.readChar() // Always advance to the next character for single-char tokens or EOF
	return tok
}

// readInteger reads an integer and returns it.
// It advances the lexer's position past the integer.
func (l *Lexer) readInteger() string { // This will be replaced by readNumber
	position := l.position
	for isDigit(l.ch) {
		l.readChar()
	}
	return string(l.input[position:l.position])
}

// peekChar returns the next character without consuming it.
// Returns 0 (NUL) if at EOF.
func (l *Lexer) peekChar() rune {
	if l.readPosition >= len(l.input) {
		return 0
	}
	return l.input[l.readPosition]
}

// readNumber reads a number (integer or float) and returns its string representation
// and a boolean indicating if it's a float.
// It advances the lexer's position past the number.
func (l *Lexer) readNumber() (literal string, isFloat bool) {
	startPosition := l.position
	isFloat = false

	// Read integer part
	for isDigit(l.ch) {
		l.readChar()
	}

	// Check for fractional part
	if l.ch == '.' && isDigit(l.peekChar()) {
		isFloat = true
		l.readChar() // Consume the '.'
		for isDigit(l.ch) {
			l.readChar()
		}
	}

	// Return the slice from startPosition to the current l.position
	// l.position is now at the character *after* the last digit of the number
	return string(l.input[startPosition:l.position]), isFloat
}


// isDigit checks if the given rune is a digit.
func isDigit(ch rune) bool {
	return '0' <= ch && ch <= '9'
}

// readString reads a string literal enclosed in double quotes.
// It returns the content of the string (without quotes) and a boolean indicating if the string was properly terminated.
func (l *Lexer) readString() (literal string, terminated bool) {
	startPosition := l.position + 1 // Position after the opening quote
	l.readChar()                   // Consume the opening quote

	for {
		if l.ch == '"' {
			terminated = true
			break // Found closing quote
		}
		if l.ch == 0 { // EOF
			terminated = false
			break // Unterminated string
		}
		// TODO: Handle escape sequences in the future (e.g., \", \n)
		l.readChar()
	}

	endPosition := l.position
	if terminated {
		l.readChar() // Consume the closing quote, to advance l.ch for the next token
	}

	if startPosition > endPosition && terminated { // Empty string ""
		return "", true
	}
	if startPosition > len(l.input) { // Should not happen if input had opening quote
	    return "", false
	}
    // Adjust endPosition for slicing if it was unterminated and we hit EOF
    // or if it's an empty string that was terminated.
    // If terminated, endPosition is on the closing quote. We want content before it.
    // If not terminated, endPosition is at EOF (len(l.input)). We want content before it.
    // The loop for readChar stops when l.ch is the closing quote or EOF.
    // So, l.position is currently AT the closing quote or AT EOF.
    // The string content is from startPosition up to l.position (exclusive of current l.ch).

	return string(l.input[startPosition:endPosition]), terminated
}
